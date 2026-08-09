const { Deployment, Project } = require("../models");

const getDeploymentsByProjectId = async (projectId, workspaceId) => {
  if(projectId === undefined || workspaceId === undefined) {
    throw new Error("Project ID and Workspace ID are required.");
  }
  try {
    return await Deployment.findAll({
      where: { project_id: projectId },
      include: [
        {
          model: Project,
          where: {
            workspace_id: workspaceId,
          },
        },
      ],
      order: [["deployed_at", "DESC"]], // Naye deployments sabse upar
    });
  } catch (error) {
    throw new Error(`Service Error: ${error.message}`);
  }
};

module.exports = {
  getDeploymentsByProjectId,
};
