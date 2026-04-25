const { Project, ProjectMember, User, sequelize } = require("../models");
const fs = require("fs-extra");
const path = require("path");
const { Op } = require('sequelize'); 

const rootDir = path.join(__dirname, "../user_projects");

const createProject = async (projectData, workspaceId) => {
  const t = await sequelize.transaction();
  console.log("Check is there any role", projectData);
  try {
    const code = `PROJ-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const slug =
      projectData.name.toLowerCase().split(" ").join("-") + "-" + Date.now();

    const projectPath = path.join(rootDir, slug);

    const project = await Project.create(
      {
        ...projectData,
        workspace_id: workspaceId,
        code,
        slug,
        folder_path: projectPath,
      },
      { transaction: t },
    );

    await fs.mkdir(projectPath, { recursive: true });

    if (projectData.manager_id) {
      await ProjectMember.create(
        {
          project_id: project.id,
          user_id: projectData.manager_id,
          project_role: "Member",
        },
        { transaction: t },
      );
    }

    await t.commit();
    return project;
  } catch (error) {
    try {
      await fs.rm(projectPath, { recursive: true, force: true });
    } catch (fsErr) {
      console.error("Cleanup failed:", fsErr);
    }

    await t.rollback();
    throw error;
  }
};

const getAllWorkspaceProjects = async (workspaceId) => {
  return await Project.findAll({
    where: { workspace_id: workspaceId },
    include: [
      {
        model: User,
        as: "manager",
        attributes: ["id", "full_name", "avatar_url"],
      },
      { 
        model: User, 
        as: "members", 
        attributes: ["id", "full_name", "email", "avatar_url"], 
        through: { 
          attributes: ["project_role"] 
        } 
      },
    ],
    order: [["created_at", "DESC"]],
  });
};

const getUserProjects = async (userId, workspaceId) => {
  const memberships = await ProjectMember.findAll({
        where: { user_id: userId },
        attributes: ['project_id']
    });

    const projectIds = memberships.map(m => m.project_id);
    
    return await Project.findAll({
        where: {
            workspace_id: workspaceId,
            id: { [Op.in]: projectIds }
        }
    });
};

const archiveProject = async (projectId) => {
  try {
    const project = await Project.findByPk(projectId);

    if (!project) {
      return null;
    }

    project.status = "ARCHIVED";
    await project.save();

    return project;
  } catch (error) {
    throw new Error(
      "Service Error: Project archive nahi ho saka - " + error.message,
    );
  }
};

const activeProject = async (projectId) => {
  try {
    const project = await Project.findByPk(projectId);

    if (!project) {
      return null;
    }

    project.status = "ACTIVE";
    await project.save();

    return project;
  } catch (error) {
    throw new Error(
      "Service Error: Project archive nahi ho saka - " + error.message,
    );
  }
};

const updateProjectTeam = async (projectId, members) => {
  console.log("this is the role that we need", members[0]?.role);
  try {
    await ProjectMember.destroy({
      where: { project_id: projectId },
    });

    if (members && members.length > 0) {
      const memberData = members.map((m) => ({
        project_id: projectId,
        user_id: m?.id,
        project_role: m?.role,
      }));

      return await ProjectMember.bulkCreate(memberData);
    }

    return true;
  } catch (error) {
    console.error("Service Error:", error);
    throw error;
  }
};

module.exports = {
  createProject,
  getAllWorkspaceProjects,
  archiveProject,
  updateProjectTeam,
  getUserProjects,
  activeProject
};
