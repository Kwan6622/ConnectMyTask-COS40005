const paymentService = require('./service');

async function createPayment(req, res, next) {
  try {
    const data = await paymentService.createCheckoutPayment(req.body, req.user);
    return res.status(201).json(data);
  } catch (err) {
    return next(err);
  }
}

async function confirmPayment(req, res, next) {
  try {
    const result = await paymentService.confirmStripeSession(req.body.sessionId, req.user);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

async function webhook(req, res, next) {
  try {
    const signature = req.headers['stripe-signature'];
    if (!signature) {
      return res.status(400).json({ error: 'BadRequest', message: 'Missing Stripe signature' });
    }
    await paymentService.handleWebhook(signature, req.body);
    return res.json({ received: true });
  } catch (err) {
    return next(err);
  }
}

async function listMyPayments(req, res, next) {
  try {
    const payments = await paymentService.listMyPayments(req.user);
    return res.json(payments);
  } catch (err) {
    return next(err);
  }
}

async function getTaskPaymentHistory(req, res, next) {
  try {
    const taskId = parseInt(req.params.taskId, 10);
    const result = await paymentService.getTaskPaymentHistory(taskId, req.user);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createPayment,
  confirmPayment,
  webhook,
  listMyPayments,
  getTaskPaymentHistory,
};
