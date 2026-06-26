const deploymentService = require('../services/deployment.service.js');

const getProjectDeployments = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Project ID is required.' 
      });
    }

    const deployments = await deploymentService.getDeploymentsByProjectId(projectId);
    
    return res.status(200).json(deployments);
  } catch (error) {
    console.error('Error in getProjectDeployments Controller:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error while fetching deployments.' 
    });
  }
};

module.exports = {
  getProjectDeployments,
};