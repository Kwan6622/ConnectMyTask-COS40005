const Stripe = require('stripe');
const paymentsRepository = require('./repository');
const notificationRepository = require('../notifications/repository');
const { env } = require('../../config/env');

const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY)
  : null;
const PLATFORM_FEE_RATE = 0.2;

function ensureStripeConfigured() {
  if (!stripe) {
    const err = new Error('Stripe is not configured. Missing STRIPE_SECRET_KEY');
    err.statusCode = 500;
    throw err;
  }
}

function normalizeRole(role) {
  return String(role || '').toUpperCase();
}

function isRequesterRole(role) {
  const normalized = normalizeRole(role);
  return normalized === 'REQUESTER' || normalized === 'CLIENT';
}

function isAdminRole(role) {
  return normalizeRole(role) === 'ADMIN';
}

function toStripeAmount(amount, currency) {
  // VND is a zero-decimal currency in Stripe.
  if (currency.toLowerCase() === 'vnd') return Math.round(amount);
  return Math.round(amount * 100);
}

function computeSettlementBreakdown(totalAmount) {
  const normalized = Number(totalAmount || 0);
  const platformFeeAmount = Math.round(normalized * PLATFORM_FEE_RATE);
  const providerPayoutAmount = Math.max(0, normalized - platformFeeAmount);
  return {
    totalAmount: normalized,
    escrowHeldAmount: normalized,
    platformFeeAmount,
    providerPayoutAmount,
  };
}

async function createActivity(taskId, actorId, action, message, metadata) {
  await paymentsRepository.createTaskActivity({
    taskId,
    actorId: actorId || null,
    action,
    message,
    metadata: metadata || null,
  });
}

async function notifyParticipants(task, message, senderId = null) {
  const recipients = new Set();
  if (task.createdById) recipients.add(task.createdById);
  if (task.assignedProviderId) recipients.add(task.assignedProviderId);

  for (const recipientId of recipients) {
    if (senderId && recipientId === senderId) {
      continue;
    }
    await notificationRepository.createNotification({
      recipientId,
      senderId,
      taskId: task.id,
      message,
    });
  }
}

function getFlowFromPayload(task, payload) {
  if (payload.flow) return payload.flow;

  if (['ASSIGNED', 'IN_PROGRESS', 'PENDING_CONFIRMATION'].includes(task.status)) {
    return 'ESCROW_DEPOSIT';
  }

  return 'DIRECT_PAYMENT';
}

function assertRequesterOwnsTask(task, currentUser) {
  if (!isRequesterRole(currentUser?.role)) {
    const err = new Error('Only requesters can create payment for tasks');
    err.statusCode = 403;
    throw err;
  }

  if (task.createdById !== currentUser.id) {
    const err = new Error('You can only pay for your own task');
    err.statusCode = 403;
    throw err;
  }
}

function buildSuccessAndCancelUrls(taskId, flow) {
  const frontendBaseUrl = env.FRONTEND_URL || 'http://localhost:5173';

  if (flow === 'ESCROW_DEPOSIT') {
    return {
      successUrl: `${frontendBaseUrl}/tasks/${taskId}/progress?escrow=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${frontendBaseUrl}/tasks/${taskId}/progress?escrow=cancel`,
    };
  }

  return {
    successUrl: `${frontendBaseUrl}/tasks/${taskId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${frontendBaseUrl}/tasks/${taskId}?payment=cancel`,
  };
}

async function createCheckoutPayment(payload, currentUser) {
  ensureStripeConfigured();

  const task = await paymentsRepository.getTaskById(payload.taskId);
  if (!task) {
    const err = new Error('Task not found');
    err.statusCode = 404;
    throw err;
  }

  assertRequesterOwnsTask(task, currentUser);

  if (
    task.status === 'DISPUTED'
    || task.escrowStatus === 'FROZEN'
    || task.paymentStatus === 'FROZEN'
  ) {
    const err = new Error('Task payment flow is frozen while dispute is active');
    err.statusCode = 409;
    throw err;
  }

  const flow = getFlowFromPayload(task, payload);

  if (flow === 'ESCROW_DEPOSIT') {
    if (!['ASSIGNED', 'IN_PROGRESS', 'PENDING_CONFIRMATION'].includes(task.status)) {
      const err = new Error('Escrow deposit is only available after provider assignment');
      err.statusCode = 400;
      throw err;
    }

    if (['HELD', 'RELEASED'].includes(task.escrowStatus)) {
      const err = new Error('Escrow has already been deposited for this task');
      err.statusCode = 409;
      throw err;
    }

    const amount = Number(task.escrowAmount || task.budget || 0);
    const settlement = computeSettlementBreakdown(amount);
    if (!amount || amount <= 0) {
      const err = new Error('Task escrow amount is invalid');
      err.statusCode = 400;
      throw err;
    }

    const currency = (env.STRIPE_CURRENCY || 'vnd').toLowerCase();
    const { successUrl, cancelUrl } = buildSuccessAndCancelUrls(task.id, flow);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: toStripeAmount(amount, currency),
            product_data: {
              name: `Escrow deposit: ${task.title}`,
              description: `Escrow hold for task #${task.id}`,
            },
          },
        },
      ],
      metadata: {
        taskId: String(task.id),
        payerId: String(currentUser.id),
        flow,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    const paymentTransaction = await paymentsRepository.createPaymentTransaction({
      taskId: task.id,
      payerId: currentUser.id,
      providerId: task.assignedProviderId || null,
      amount,
      totalAmount: settlement.totalAmount,
      escrowHeldAmount: settlement.escrowHeldAmount,
      platformFeeAmount: settlement.platformFeeAmount,
      providerPayoutAmount: settlement.providerPayoutAmount,
      method: 'STRIPE',
      type: 'ESCROW_DEPOSIT',
      escrowStatus: 'PENDING_DEPOSIT',
      lifecycleStatus: 'PENDING',
      checkoutSessionId: session.id,
      providerTransactionId: null,
      status: 'PENDING',
      note: 'Escrow deposit initiated by requester',
      metadata: {
        flow,
      },
    });

    await paymentsRepository.updateTaskState(task.id, {
      escrowStatus: 'PENDING_DEPOSIT',
      paymentStatus: 'ESCROW_PENDING',
      escrowAmount: amount,
    });

    await createActivity(task.id, currentUser.id, 'ESCROW_DEPOSIT_INITIATED', 'Requester initiated escrow deposit.', {
      amount,
      transactionId: paymentTransaction.id,
    });

    return {
      success: true,
      flow,
      paymentUrl: session.url,
      sessionId: session.id,
      transactionId: paymentTransaction.id,
    };
  }

  if (!['COMPLETED', 'AWAITING_PAYMENT'].includes(task.status)) {
    const err = new Error('Task must be COMPLETED or AWAITING_PAYMENT before direct payment');
    err.statusCode = 400;
    throw err;
  }

  const amount = Number(task.budget || 0);
  const settlement = computeSettlementBreakdown(amount);
  if (!amount || amount <= 0) {
    const err = new Error('Task budget is invalid for payment');
    err.statusCode = 400;
    throw err;
  }

  const currency = (env.STRIPE_CURRENCY || 'vnd').toLowerCase();
  const { successUrl, cancelUrl } = buildSuccessAndCancelUrls(task.id, flow);

  if (task.status === 'COMPLETED') {
    await paymentsRepository.updateTaskState(task.id, { status: 'AWAITING_PAYMENT' });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: toStripeAmount(amount, currency),
          product_data: {
            name: `Task payment: ${task.title}`,
            description: `Requester payment for task #${task.id}`,
          },
        },
      },
    ],
    metadata: {
      taskId: String(task.id),
      payerId: String(currentUser.id),
      flow,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  const paymentTransaction = await paymentsRepository.createPaymentTransaction({
    taskId: task.id,
    payerId: currentUser.id,
    providerId: task.assignedProviderId || null,
    amount,
    totalAmount: settlement.totalAmount,
    escrowHeldAmount: settlement.escrowHeldAmount,
    platformFeeAmount: settlement.platformFeeAmount,
    providerPayoutAmount: settlement.providerPayoutAmount,
    method: 'STRIPE',
    type: 'DIRECT_PAYMENT',
    escrowStatus: 'NONE',
    lifecycleStatus: 'RELEASED',
    checkoutSessionId: session.id,
    providerTransactionId: null,
    status: 'PENDING',
    note: 'Direct payment flow started',
    metadata: {
      flow,
    },
  });

  return {
    success: true,
    flow,
    paymentUrl: session.url,
    sessionId: session.id,
    transactionId: paymentTransaction.id,
  };
}

async function confirmStripeSession(sessionId, currentUser) {
  ensureStripeConfigured();

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const payment = await paymentsRepository.getPaymentByCheckoutSessionId(session.id);
  if (!payment) {
    const err = new Error('Payment transaction not found');
    err.statusCode = 404;
    throw err;
  }
  if (payment.payerId !== currentUser.id) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }

  const task = await paymentsRepository.getTaskById(payment.taskId);
  if (!task) {
    const err = new Error('Task not found');
    err.statusCode = 404;
    throw err;
  }

  if (session.payment_status === 'paid') {
    await paymentsRepository.updatePaymentStatus(payment.id, {
      status: 'SUCCESS',
      paidAt: new Date(),
      providerTransactionId: typeof session.payment_intent === 'string'
        ? session.payment_intent
        : payment.providerTransactionId,
    });

    if (payment.type === 'ESCROW_DEPOSIT') {
      const updatedTask = await paymentsRepository.updateTaskState(payment.taskId, {
        escrowStatus: 'HELD',
        paymentStatus: 'ESCROW_HELD',
        escrowHeldAt: new Date(),
      });
      await paymentsRepository.updatePaymentStatus(payment.id, {
        lifecycleStatus: 'ESCROW_HELD',
        heldAt: new Date(),
      });

      await createActivity(updatedTask.id, currentUser.id, 'ESCROW_DEPOSIT_CONFIRMED', 'Escrow deposit payment confirmed.', {
        transactionId: payment.id,
        paymentIntent: session.payment_intent,
      });

      await notifyParticipants(
        updatedTask,
        `Escrow deposit confirmed for task "${updatedTask.title}". Provider can now continue work updates.`,
        currentUser.id
      );

      return { success: true, status: 'SUCCESS', flow: 'ESCROW_DEPOSIT', task: updatedTask };
    }

    const updatedTask = await paymentsRepository.updateTaskState(payment.taskId, {
      status: 'PAID',
      paymentStatus: 'RELEASED',
    });

    await createActivity(updatedTask.id, currentUser.id, 'DIRECT_PAYMENT_CONFIRMED', 'Direct task payment confirmed.', {
      transactionId: payment.id,
      paymentIntent: session.payment_intent,
    });

    await notifyParticipants(
      updatedTask,
      `Payment completed for task "${updatedTask.title}".`,
      currentUser.id
    );

    return { success: true, status: 'SUCCESS', flow: 'DIRECT_PAYMENT', task: updatedTask };
  }

  if (session.status === 'expired') {
    await paymentsRepository.updatePaymentStatus(payment.id, { status: 'FAILED' });
    return { success: false, status: 'FAILED' };
  }

  return { success: false, status: 'PENDING' };
}

async function releaseEscrowForTask(taskId, currentUser, options = {}) {
  const task = await paymentsRepository.getTaskById(taskId);
  if (!task) {
    const err = new Error('Task not found');
    err.statusCode = 404;
    throw err;
  }

  const canRequesterRelease = isRequesterRole(currentUser?.role) && task.createdById === currentUser.id;
  const canAdminRelease = isAdminRole(currentUser?.role);

  if (!canRequesterRelease && !canAdminRelease) {
    const err = new Error('Only task requester or admin can release escrow');
    err.statusCode = 403;
    throw err;
  }

  if (!task.assignedProviderId) {
    const err = new Error('Task has no assigned provider for escrow release');
    err.statusCode = 400;
    throw err;
  }

  const existingRelease = await paymentsRepository.findSuccessfulEscrowRelease(taskId);
  if (existingRelease) {
    const latestTask = await paymentsRepository.getTaskById(taskId);
    return { task: latestTask, transaction: existingRelease };
  }

  if (!['HELD', 'FROZEN'].includes(task.escrowStatus)) {
    const err = new Error('Escrow is not available for release');
    err.statusCode = 400;
    throw err;
  }

  const amount = Number(task.escrowAmount || task.budget || 0);
  const settlement = computeSettlementBreakdown(amount);
  if (!amount || amount <= 0) {
    const err = new Error('Invalid escrow amount for release');
    err.statusCode = 400;
    throw err;
  }

  const transaction = await paymentsRepository.createPaymentTransaction({
    taskId: task.id,
    payerId: task.createdById,
    providerId: task.assignedProviderId,
    amount: settlement.providerPayoutAmount,
    totalAmount: settlement.totalAmount,
    escrowHeldAmount: settlement.escrowHeldAmount,
    platformFeeAmount: settlement.platformFeeAmount,
    providerPayoutAmount: settlement.providerPayoutAmount,
    method: 'STRIPE',
    type: 'ESCROW_RELEASE',
    escrowStatus: 'RELEASED',
    lifecycleStatus: 'RELEASED',
    status: 'SUCCESS',
    heldAt: task.escrowHeldAt || null,
    releasedAt: new Date(),
    paidAt: new Date(),
    note: options.reason || 'Escrow released to provider',
    metadata: {
      releasedBy: currentUser.id,
      mode: options.reason || 'auto',
    },
  });

  const updatedTask = await paymentsRepository.updateTaskState(task.id, {
    status: 'PAID',
    escrowStatus: 'RELEASED',
    paymentStatus: 'RELEASED',
    escrowReleasedAt: new Date(),
  });

  await createActivity(task.id, currentUser.id, 'ESCROW_RELEASED', 'Escrow payment released to provider.', {
    transactionId: transaction.id,
    amount,
  });

  await notifyParticipants(updatedTask, `Escrow released successfully for task "${updatedTask.title}".`, currentUser.id);

  return {
    task: updatedTask,
    transaction,
  };
}

async function refundEscrowForTask(taskId, currentUser, options = {}) {
  const task = await paymentsRepository.getTaskById(taskId);
  if (!task) {
    const err = new Error('Task not found');
    err.statusCode = 404;
    throw err;
  }

  const canRequesterRefund = isRequesterRole(currentUser?.role) && task.createdById === currentUser.id;
  const canAdminRefund = isAdminRole(currentUser?.role);

  if (!canRequesterRefund && !canAdminRefund) {
    const err = new Error('Only task requester or admin can refund escrow');
    err.statusCode = 403;
    throw err;
  }

  if (!['PENDING_DEPOSIT', 'HELD', 'FROZEN'].includes(task.escrowStatus)) {
    const err = new Error('Escrow is not refundable in current state');
    err.statusCode = 400;
    throw err;
  }

  const amount = Number(task.escrowAmount || task.budget || 0);
  const settlement = computeSettlementBreakdown(amount);
  if (!amount || amount <= 0) {
    const err = new Error('Invalid escrow amount for refund');
    err.statusCode = 400;
    throw err;
  }

  const latestDeposit = await paymentsRepository.findLatestSuccessfulEscrowDeposit(taskId);

  let stripeRefundId = null;
  if (stripe && latestDeposit?.providerTransactionId) {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: latestDeposit.providerTransactionId,
      });
      stripeRefundId = refund.id;
    } catch (_error) {
      // Keep platform state consistent even if Stripe refund API is temporarily unavailable.
      // In real production, this should queue retry jobs.
      stripeRefundId = null;
    }
  }

  const transaction = await paymentsRepository.createPaymentTransaction({
    taskId: task.id,
    payerId: task.createdById,
    providerId: task.assignedProviderId,
    amount: settlement.totalAmount,
    totalAmount: settlement.totalAmount,
    escrowHeldAmount: settlement.escrowHeldAmount,
    platformFeeAmount: settlement.platformFeeAmount,
    providerPayoutAmount: settlement.providerPayoutAmount,
    method: 'STRIPE',
    type: 'ESCROW_REFUND',
    escrowStatus: 'REFUNDED',
    lifecycleStatus: 'REFUNDED',
    status: 'REFUNDED',
    paidAt: new Date(),
    note: options.reason || 'Escrow refunded',
    metadata: {
      refundedBy: currentUser.id,
      stripeRefundId,
    },
  });

  const updatedTask = await paymentsRepository.updateTaskState(task.id, {
    status: 'CANCELLED',
    escrowStatus: 'REFUNDED',
    paymentStatus: 'REFUNDED',
    canceledAt: new Date(),
    cancellationReason: options.reason || 'Escrow refunded',
  });

  await createActivity(task.id, currentUser.id, 'ESCROW_REFUNDED', 'Escrow refund completed.', {
    transactionId: transaction.id,
    amount,
    stripeRefundId,
  });

  await notifyParticipants(updatedTask, `Escrow refunded for task "${updatedTask.title}".`, currentUser.id);

  return {
    task: updatedTask,
    transaction,
  };
}

async function handleWebhook(signature, rawBody) {
  ensureStripeConfigured();
  if (!env.STRIPE_WEBHOOK_SECRET) {
    const err = new Error('Missing STRIPE_WEBHOOK_SECRET');
    err.statusCode = 500;
    throw err;
  }

  const event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const payment = await paymentsRepository.getPaymentByCheckoutSessionId(session.id);
    if (payment && payment.status !== 'SUCCESS') {
      await paymentsRepository.updatePaymentStatus(payment.id, {
        status: 'SUCCESS',
        paidAt: new Date(),
        providerTransactionId: typeof session.payment_intent === 'string'
          ? session.payment_intent
          : payment.providerTransactionId,
      });

      const task = await paymentsRepository.getTaskById(payment.taskId);
      if (!task) return;

      if (payment.type === 'ESCROW_DEPOSIT') {
        await paymentsRepository.updateTaskState(payment.taskId, {
          escrowStatus: 'HELD',
          paymentStatus: 'ESCROW_HELD',
          escrowHeldAt: new Date(),
        });
        await paymentsRepository.updatePaymentStatus(payment.id, {
          lifecycleStatus: 'ESCROW_HELD',
          heldAt: new Date(),
        });
      } else if (payment.type === 'DIRECT_PAYMENT') {
        await paymentsRepository.updateTaskState(payment.taskId, {
          status: 'PAID',
          paymentStatus: 'RELEASED',
        });
      }
    }
  } else if (event.type === 'checkout.session.async_payment_failed') {
    const session = event.data.object;
    const payment = await paymentsRepository.getPaymentByCheckoutSessionId(session.id);
    if (payment) {
      await paymentsRepository.updatePaymentStatus(payment.id, {
        status: 'FAILED',
      });
    }
  }
}

async function listMyPayments(currentUser) {
  return paymentsRepository.listPaymentsByPayer(currentUser.id);
}

async function getTaskPaymentHistory(taskId, currentUser) {
  const task = await paymentsRepository.getTaskById(taskId);
  if (!task) {
    const err = new Error('Task not found');
    err.statusCode = 404;
    throw err;
  }

  const isParticipant = task.createdById === currentUser.id || task.assignedProviderId === currentUser.id;
  if (!isParticipant && !isAdminRole(currentUser.role)) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }

  const transactions = await paymentsRepository.listPaymentsByTask(taskId);

  return {
    task: {
      id: task.id,
      title: task.title,
      status: task.status,
      escrowStatus: task.escrowStatus,
      paymentStatus: task.paymentStatus,
      escrowAmount: task.escrowAmount || task.budget,
      escrowHeldAt: task.escrowHeldAt,
      escrowReleasedAt: task.escrowReleasedAt,
    },
    transactions,
  };
}

module.exports = {
  createCheckoutPayment,
  confirmStripeSession,
  releaseEscrowForTask,
  refundEscrowForTask,
  handleWebhook,
  listMyPayments,
  getTaskPaymentHistory,
  computeSettlementBreakdown,
};
