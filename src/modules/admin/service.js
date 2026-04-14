const adminRepository = require('./repository');
const paymentService = require('../payments/service');

function assertAdmin(currentUser) {
  if (String(currentUser?.role || '').toUpperCase() !== 'ADMIN') {
    const err = new Error('Only admin can access this resource');
    err.statusCode = 403;
    throw err;
  }
}

function parseId(value, label) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    const err = new Error(`Invalid ${label}`);
    err.statusCode = 400;
    throw err;
  }
  return id;
}

async function getStats(currentUser) {
  assertAdmin(currentUser);
  return adminRepository.getAdminStats();
}

async function getTasks(currentUser) {
  assertAdmin(currentUser);
  return adminRepository.listAdminTasks();
}

async function getSuspiciousTasks(currentUser) {
  assertAdmin(currentUser);
  return adminRepository.listAdminTasks({ suspiciousOnly: true });
}

async function deleteTask(taskIdRaw, currentUser) {
  assertAdmin(currentUser);
  const taskId = parseId(taskIdRaw, 'task id');
  return adminRepository.softDeleteTask(taskId, currentUser.id);
}

async function reviewTask(taskIdRaw, currentUser) {
  assertAdmin(currentUser);
  const taskId = parseId(taskIdRaw, 'task id');
  return adminRepository.markTaskReviewed(taskId, currentUser.id);
}

async function getCertificates(currentUser) {
  assertAdmin(currentUser);
  return adminRepository.listCertificates();
}

async function verifyCertificate(certificateIdRaw, currentUser) {
  assertAdmin(currentUser);
  const certificateId = parseId(certificateIdRaw, 'certificate id');
  return adminRepository.verifyCertificate(certificateId, currentUser.id, 'VERIFIED');
}

async function rejectCertificate(certificateIdRaw, currentUser) {
  assertAdmin(currentUser);
  const certificateId = parseId(certificateIdRaw, 'certificate id');
  return adminRepository.verifyCertificate(certificateId, currentUser.id, 'REJECTED');
}

async function getPayments(currentUser) {
  assertAdmin(currentUser);
  return adminRepository.listPayments();
}

async function getEscrowPayments(currentUser) {
  assertAdmin(currentUser);
  return adminRepository.listPayments({ lifecycleStatus: 'ESCROW_HELD' });
}

async function releasePayment(paymentIdRaw, currentUser) {
  assertAdmin(currentUser);
  const paymentId = parseId(paymentIdRaw, 'payment id');
  const payment = await adminRepository.getPaymentById(paymentId);
  if (!payment) {
    const err = new Error('Payment not found');
    err.statusCode = 404;
    throw err;
  }
  if (!payment.taskId) {
    const err = new Error('Payment missing task reference');
    err.statusCode = 400;
    throw err;
  }

  const released = await paymentService.releaseEscrowForTask(payment.taskId, currentUser, {
    reason: 'Admin manual release',
  });
  return released;
}

module.exports = {
  getStats,
  getTasks,
  getSuspiciousTasks,
  deleteTask,
  reviewTask,
  getCertificates,
  verifyCertificate,
  rejectCertificate,
  getPayments,
  getEscrowPayments,
  releasePayment,
};
