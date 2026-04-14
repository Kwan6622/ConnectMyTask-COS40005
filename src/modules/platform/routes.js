const express = require('express');
const platformController = require('./controller');

const router = express.Router();

router.get('/stats', platformController.getPlatformStats);

module.exports = router;
