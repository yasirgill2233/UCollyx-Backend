const { Project, ProjectMember, User, sequelize, Channel, ChannelMember, Task } = require("../models");
const fs = require("fs-extra");
const path = require("path");
const { Op } = require('sequelize'); 

const rootDir = path.join(__dirname, "../user_projects");

const createProject = async (projectData, workspaceId, creatorId) => {
  const t = await sequelize.transaction();
  console.log("Check is there any role", projectData);

  const existingProject = await Project.findOne({
    where: {
      workspace_id: workspaceId,
      name: projectData.name.trim()
    }
  });

  if (existingProject) {
    // Agar project already exist karta hai toh error throw karein
    const error = new Error('A project with this name already exists in your workspace');
    error.status = 400; // Bad request status
    throw error;
  }
  
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


    // 4. Create Channel if createChannel is true
    if (projectData.createChannel) {
      // Create clean channel name (e.g. #alpha-project)
      const channelName = `#${projectData.name.toLowerCase().replace(/[^a-zA-Z0-9]+/g, "-")}`;

      const channel = await Channel.create(
        {
          name: channelName,
          description: `Discussion channel for project: ${projectData.name}`,
          type: "public",
          is_private: false,
          created_by: creatorId,
        },
        { transaction: t }
      );

      // Jisne project banaya, usko channel mein as an 'admin' join karayein
      await ChannelMember.create(
        {
          channel_id: channel.id,
          user_id: creatorId,
          role_in_channel: "admin",
          is_muted: false,
        },
        { transaction: t }
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
        },
        include: [
      {
        model: User,
        as:'members',
        // where: { id: userId }, // Taake array mein sirf is user ka data hi select ho kar aaye
        attributes: ["id", "full_name", "avatar_url"],
        through: {
          attributes: [] // Agar junction table se project_role bhi chahiye ho
        }
      }
    ],
    });
};

const archiveProject = async (projectId) => {
  try {
    const project = await Project.findByPk(projectId);

    if (!project) {
      throw new Error("Project not found");
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
      throw new Error("Project not found");
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
    throw error;
  }
};


const fetchManagerPortfolio = async (managerId) => {
  const portfolioData = await Project.findAll({
    attributes: [
      "id",
      "name",
      "status",
      
      [
        sequelize.literal(`
          COALESCE(
            ROUND(
              (COUNT(CASE WHEN Tasks.status = 'done' THEN 1 END) * 100.0) / NULLIF(COUNT(Tasks.id), 0)
            ), 0
          )
        `),
        "progress"
      ],
      
      [
        sequelize.literal(`
          CONCAT(
            COUNT(CASE WHEN Tasks.status = 'done' THEN 1 END), 
            '/', 
            COUNT(Tasks.id)
          )
        `),
        "tasksCount"
      ],
      
      [
        sequelize.literal(`
          COUNT(CASE WHEN Tasks.priority = 'High' AND Tasks.status != 'done' THEN 1 END)
        `),
        "redCards"
      ],
      
      // 📊 4. Micro status segment values
      [sequelize.literal(`COUNT(CASE WHEN Tasks.status = 'todo' THEN 1 END)`), "todoCount"],
      [sequelize.literal(`COUNT(CASE WHEN Tasks.status = 'inprogress' THEN 1 END)`), "inprogressCount"],
      [sequelize.literal(`COUNT(CASE WHEN Tasks.status = 'blocked' THEN 1 END)`), "blockedCount"],
      [sequelize.literal(`COUNT(CASE WHEN Tasks.status = 'done' THEN 1 END)`), "doneCount"]
    ],
    include: [
      {
        model: Task,
        attributes: [], // Output clean rakhne ke liye tasks metadata empty rakha
        required: false
      }
    ],
    // Filtering logic (Optional: Agar aap chahein ke manager ko sirf uske links dikhein)
    where: { manager_id: 1 }, 
    group: ["Project.id"],
    order: [["createdAt", "DESC"]]
  });

  return portfolioData;
};

// const fetchProjectFullDetails = async (projectId) => {
//   // 1. Basic Stats & Project Info
//   const project = await Project.findByPk(projectId, {
//     attributes: [
//       'id', 'name', 'status', 'start_date', 'end_date',
//       [Sequelize.literal(`(SELECT COUNT(*) FROM Tasks WHERE Tasks.project_id = Project.id AND Tasks.status = 'done') * 100 / NULLIF((SELECT COUNT(*) FROM Tasks WHERE Tasks.project_id = Project.id), 0)`), 'progress']
//     ]
//   });

//   // 2. Aggregate Task Counts
//   const counts = await Task.findAll({
//     where: { project_id: projectId },
//     attributes: [
//       'status',
//       [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
//     ],
//     group: ['status']
//   });

//   // 3. Fetch Recent Risks/Red Cards
//   const risks = await Risk.findAll({
//     where: { project_id: projectId },
//     limit: 5,
//     order: [['createdAt', 'DESC']]
//   });

//   // 4. Fetch Recent Deployments
//   const deployments = await Deployment.findAll({
//     where: { project_id: projectId },
//     limit: 5,
//     order: [['createdAt', 'DESC']]
//   });

//   // 5. Team Load (Optional: Join with Users)
//   const teamLoad = await Task.findAll({
//     where: { project_id: projectId, status: ['todo', 'inprogress'] },
//     attributes: ['assignedTo', [Sequelize.fn('COUNT', Sequelize.col('id')), 'taskCount']],
//     group: ['assignedTo']
//   });

//   return {
//     ...project.toJSON(),
//     counts,
//     risks,
//     deployments,
//     teamLoad
//   };
// };

module.exports = {
  createProject,
  getAllWorkspaceProjects,
  archiveProject,
  updateProjectTeam,
  getUserProjects,
  activeProject,
  fetchManagerPortfolio,
  // fetchProjectFullDetails
};
