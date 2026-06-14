const adminService = require("../services/admin.service");

const fetchDashboardOverview = async (req, res) => {
  try {
    // 🛡️ Logged-in admin capability profile verification inside context loop
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, error: "Access Denied: Admin Clearance Required." });
    }

    const dashboardMetrics = await adminService.getAdminDashboardStats();

    console.log(dashboardMetrics)
    
    return res.status(200).json({
      success: true,
      data: dashboardMetrics
    });
  } catch (error) {
    console.error("❌ Admin Dashboard API pipeline error:", error.message);
    return res.status(500).json({
      success: false,
      error: "Internal Analytics Engine Compilation Error"
    });
  }
};

module.exports = {
  fetchDashboardOverview
};