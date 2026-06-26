const { Deployment } = require("../models");


const getDeploymentsByProjectId = async (projectId) => {
  try {
    return await Deployment.findAll({
      where: { project_id: projectId },
      order: [['deployed_at', 'DESC']], // Naye deployments sabse upar
    });
  } catch (error) {
    throw new Error(`Service Error: ${error.message}`);
  }
};

module.exports = {
  getDeploymentsByProjectId,
};