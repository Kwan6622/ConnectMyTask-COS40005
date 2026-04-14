const adminService = require('./service');

async function getStats(req, res, next) {
  try {
    const result = await adminService.getStats(req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function getTasks(req, res, next) {
  try {
    const result = await adminService.getTasks(req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function getSuspiciousTasks(req, res, next) {
  try {
    const result = await adminService.getSuspiciousTasks(req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function deleteTask(req, res, next) {
  try {
    const result = await adminService.deleteTask(req.params.id, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function reviewTask(req, res, next) {
  try {
    const result = await adminService.reviewTask(req.params.id, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function getCertificates(req, res, next) {
  try {
    const result = await adminService.getCertificates(req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function verifyCertificate(req, res, next) {
  try {
    const result = await adminService.verifyCertificate(req.params.id, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function rejectCertificate(req, res, next) {
  try {
    const result = await adminService.rejectCertificate(req.params.id, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function getPayments(req, res, next) {
  try {
    const result = await adminService.getPayments(req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function getEscrowPayments(req, res, next) {
  try {
    const result = await adminService.getEscrowPayments(req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function releasePayment(req, res, next) {
  try {
    const result = await adminService.releasePayment(req.params.id, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
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
