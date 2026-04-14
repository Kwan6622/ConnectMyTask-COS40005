const express = require('express');
const { authenticate, requireRoles } = require('../../shared/middlewares/auth');
const adminController = require('./controller');

const router = express.Router();

router.use(authenticate, requireRoles('ADMIN'));

router.get('/stats', adminController.getStats);
router.get('/tasks', adminController.getTasks);
router.get('/tasks/suspicious', adminController.getSuspiciousTasks);
router.delete('/tasks/:id', adminController.deleteTask);
router.patch('/tasks/:id/reviewed', adminController.reviewTask);

router.get('/certificates', adminController.getCertificates);
router.patch('/certificates/:id/verify', adminController.verifyCertificate);
router.patch('/certificates/:id/reject', adminController.rejectCertificate);

router.get('/payments', adminController.getPayments);
router.get('/payments/escrow', adminController.getEscrowPayments);
router.patch('/payments/:id/release', adminController.releasePayment);

module.exports = router;
