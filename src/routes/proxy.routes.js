const express = require('express');
const router = express.Router();

const proxyController = require('../controllers/proxy.controller');

router.use(proxyController.handlePreview);

module.exports = router;