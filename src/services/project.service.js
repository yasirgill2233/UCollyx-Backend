const { Project, ProjectMember, User, sequelize } = require("../models");
const fs = require("fs-extra");
const path = require("path");
const { Op } = require('sequelize'); // Import Op

const rootDir = path.join(__dirname, "../user_projects");

// 1. Create Project Function
const createProject = async (projectData, workspaceId) => {
  const t = await sequelize.transaction();
  console.log("Check is there any role", projectData);
  // const projectPath = path.join(rootDir, slug);
  try {
    // Unique Code aur Slug backend par generate karein
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

    // Agar manager select kiya gaya hai, to usay automatic member banayein
    if (projectData.manager_id) {
      await ProjectMember.create(
        {
          project_id: project.id,
          user_id: projectData.manager_id,
          project_role: "Member", // Default role
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

// 2. Get All Projects Function
const getAllWorkspaceProjects = async (workspaceId) => {
  return await Project.findAll({
    where: { workspace_id: workspaceId },
    include: [
      {
        model: User,
        as: "manager",
        attributes: ["id", "full_name", "avatar_url"],
      },
      { model: User, as: "members", through: { attributes: ["project_role"] } },
    ],
    order: [["created_at", "DESC"]],
  });
};

const getUserProjects = async (userId, workspaceId) => {
  const memberships = await ProjectMember.findAll({
        where: { user_id: userId },
        attributes: ['project_id'] // Sirf project_id chahiye
    });

    const projectIds = memberships.map(m => m.project_id);

    // 2. Ab sirf un projects ko fetch karo jo workspace aur IDs se match karte hain
    
    return await Project.findAll({
        where: {
            workspace_id: workspaceId,
            id: { [Op.in]: projectIds } // Sirf user ke projects
        }
    });
};

const archiveProject = async (projectId) => {
  try {
    const project = await Project.findByPk(projectId);

    if (!project) {
      return null; // Controller handle karega agar project na mila
    }

    // Status update
    project.status = "ARCHIVED";
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
    // 1. Pehle purane members delete karein
    await ProjectMember.destroy({
      where: { project_id: projectId },
    });

    // 2. Agar members hain toh bulk insert karein
    if (members && members.length > 0) {
      const memberData = members.map((m) => ({
        project_id: projectId,
        user_id: m?.id, // Ensure karein frontend se 'id' aa rahi hai
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
};
