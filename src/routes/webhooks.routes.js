const express = require("express");
const router = express.Router();

const { handlePipelineStatus } = require("../controllers/webhook.controller");

router.post("/pipeline-status", handlePipelineStatus);

module.exports = router;
