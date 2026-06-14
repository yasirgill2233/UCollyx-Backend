const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const { protect } = require('../middleware/auth.middleware');

router.get("/dashboard-overview", protect, adminController.fetchDashboardOverview);

module.exports = router;