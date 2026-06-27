const {getProjectDashboardData} = require('../services/team.service');

const getProjectDashboard = async (req, res) => {
  try {
    const { projectId } = req.params;

    const workpaceId = req.user.workspace_id
    const userId = req.user.id
    
    // Direct function call
    const data = await getProjectDashboardData(projectId, userId, workpaceId);
    
    console.log("##################################################################################################",data)
    
    return res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error"
    });
  }
};

module.exports = { getProjectDashboard };