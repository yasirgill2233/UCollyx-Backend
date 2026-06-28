const { Project, ProjectMember, User, sequelize, Channel, ChannelMember, Task } = require("../models");
const path = require("path");
const { Op } = require('sequelize'); 

const rootDir = path.join(__dirname, "../../user_projects");

const fs = require("fs/promises");

const { generateWorkflowYaml } = require("../utils/helpers/pipelineTemplates");

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
    const error = new Error('A project with this name already exists in your workspace');
    error.status = 400;
    throw error;
  }
  
  // Scoping variable for catch block access
  let projectPath = ""; 

  try {
    const code = `PROJ-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const slug = projectData.name.toLowerCase().split(" ").join("-") + "-" + Date.now();

    // ⚡ Base folder configuration mapping
    projectPath = path.join(rootDir, slug);

    console.log("#########################################################################################", projectPath, workspaceId, code, slug, projectData);
    
    // 1. Create project entry in database
    const project = await Project.create(
      {
        ...projectData,
        workspace_id: workspaceId,
        code,
        slug,
        folder_path: projectPath,
        framework: projectData.framework || "nodejs-express" // Frontend selection save kar rahe hain
      },
      { transaction: t },
    );

    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@", project);

    // 2. Physical directories initialization inside UCollyx storage system
    // Hum automatically `.github/workflows` ki folder structure sath hi create kar dete hain
    const workflowDirectory = path.join(projectPath, ".github", "workflows");
    await fs.mkdir(workflowDirectory, { recursive: true });

    // 3. Dynamic YAML string generator mapping according to selected framework stack
    const yamlContent = generateWorkflowYaml(project.name, project.id, project.framework);

    // 4. File configuration compilation safely injected inside target workspace
    await fs.writeFile(path.join(workflowDirectory, "deploy.yml"), yamlContent, "utf8");

    // Project Member allocation logic
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

    // Communication channels deployment criteria
    if (projectData.createChannel) {
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
    // ⚡ CRITICAL CLEANUP: Agar sequence database par fetch na ho, toh generate hua folder delete ho jaye
    if (projectPath) {
      try {
        await fs.rm(projectPath, { recursive: true, force: true });
        console.log("Cleaned up orphaned folders safely from server workspace stack.");
      } catch (fsErr) {
        console.error("Cleanup failed:", fsErr);
      }
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
  console.log("this is the role that we need", projectId, members[0]?.role);

  try {
    // Delete existing members
    await ProjectMember.destroy({
      where: { project_id: projectId },
    });

    // Update project manager
    await Project.update(
      {
        manager_id: members.find(
        (member) => member.role?.toLowerCase() === "manager"
      )?.id || null,
      },
      {
        where: { id: projectId },
      }
    );

    // Add new members
    if (members && members.length > 0) {
      const memberData = members.map((m) => ({
        project_id: projectId,
        user_id: m.id,
        project_role: m.role,
      }));

      return await ProjectMember.bulkCreate(memberData);
    }

    return true;
  } catch (error) {
    throw error;
  }
};

const fetchManagerPortfolio = async (managerId) => {
  console.log("### Fetching Current Sprint Isolated Metrics for Manager:", managerId);

  const portfolioData = await Project.findAll({
    attributes: [
      "id",
      "name",
      "status",
      "current_sprint",

      // 🔄 1. PROGRESS ENGINE (Calculates sprint progress instantly)
      [
        sequelize.literal(`
          COALESCE(
            ROUND(
              (COUNT(CASE WHEN \`Tasks\`.\`status\` = 'done' THEN 1 END) * 100.0) / NULLIF(COUNT(\`Tasks\`.\`id\`), 0)
            ), 0
          )
        `),
        "progress"
      ],

      // 📊 2. CURRENT SPRINT TASKS COUNT (e.g., "3/7")
      [
        sequelize.literal(`
          CONCAT(
            COUNT(CASE WHEN \`Tasks\`.\`status\` = 'done' THEN 1 END), 
            '/', 
            COUNT(\`Tasks\`.\`id\`)
          )
        `),
        "tasksCount"
      ],

      // 🚨 3. RED CARDS (High Priority Issues inside current scope)
      [
        sequelize.literal(`
          COUNT(CASE WHEN \`Tasks\`.\`priority\` = 'High' AND \`Tasks\`.\`status\` != 'done' THEN 1 END)
        `),
        "redCards"
      ],

      // 🏎️ 4. MICRO COUNTERS FOR LIVE BOARD
      [sequelize.literal(`COUNT(CASE WHEN \`Tasks\`.\`status\` = 'todo' THEN 1 END)`), "todoCount"],
      [sequelize.literal(`COUNT(CASE WHEN \`Tasks\`.\`status\` = 'inprogress' THEN 1 END)`), "inprogressCount"],
      [sequelize.literal(`COUNT(CASE WHEN \`Tasks\`.\`status\` = 'blocked' THEN 1 END)`), "blockedCount"],
      [sequelize.literal(`COUNT(CASE WHEN \`Tasks\`.\`status\` = 'done' THEN 1 END)`), "doneCount"],

      // 🗓️ 5. CURRENT SPRINT METADATA EXTRACTION (Sub-queries keep aggregate processing clean)
      [
        sequelize.literal(`(
          SELECT \`name\` FROM \`sprints\` 
          WHERE \`sprints\`.\`id\` = \`Project\`.\`current_sprint\` 
          LIMIT 1
        )`),
        "current_sprint_name"
      ],
      [
        sequelize.literal(`(
          SELECT \`start_date\` FROM \`sprints\` 
          WHERE \`sprints\`.\`id\` = \`Project\`.\`current_sprint\` 
          LIMIT 1
        )`),
        "start_date"
      ],
      [
        sequelize.literal(`(
          SELECT \`end_date\` FROM \`sprints\` 
          WHERE \`sprints\`.\`id\` = \`Project\`.\`current_sprint\` 
          LIMIT 1
        )`),
        "end_date"
      ],
      [
        sequelize.literal(`(
          SELECT CASE 
            WHEN \`status\` = 'active' THEN 'current'
            WHEN \`status\` = 'planned' THEN 'future'
            ELSE \`status\`
          END FROM \`sprints\` 
          WHERE \`sprints\`.\`id\` = \`Project\`.\`current_sprint\` 
          LIMIT 1
        )`),
        "active_sprint_status"
      ]
    ],
    include: [
      {
        model: Task,
        attributes: [],
        required: false,
        // ⚡ FIXED BINDING CRITERIA: Bypassing Op.col syntax mismatch glitch 
        // Yeh query absolute level par link assign karegi direct injection se
        where: sequelize.where(
          sequelize.col("Tasks.sprint_id"),
          "=",
          sequelize.col("Project.current_sprint")
        )
      }
    ],
    where: { manager_id: managerId },
    group: ["Project.id"],
    order: [["createdAt", "DESC"]]
  });

  return portfolioData;
};

const fetchDeveloperDashboard = async (userId, workspaceId) => {

  const memberships = await ProjectMember.findAll({
        where: { user_id: userId },
        attributes: ['project_id']
    });

    const projectIds = memberships.map(m => m.project_id);

  const portfolioData = await Project.findAll({
    attributes: [
      "id",
      "name",
      "status",
      "current_sprint",
      [
        sequelize.literal(`
          COALESCE(
            ROUND(
              (COUNT(CASE WHEN \`Tasks\`.\`status\` = 'done' THEN 1 END) * 100.0) / NULLIF(COUNT(\`Tasks\`.\`id\`), 0)
            ), 0
          )
        `),
        "progress"
      ],
    ],
    include: [
      {
        model: Task,
        attributes: [],
        required: false,
        where: sequelize.where(
          sequelize.col("Tasks.sprint_id"),
          "=",
          sequelize.col("Project.current_sprint")
        )
      }
    ],
    where: {
            workspace_id: workspaceId,
            id: { [Op.in]: projectIds }
        },
    group: ["Project.id"],
    order: [["createdAt", "DESC"]]
  });

  return portfolioData;
};

module.exports = {
  createProject,
  getAllWorkspaceProjects,
  archiveProject,
  updateProjectTeam,
  getUserProjects,
  activeProject,
  fetchManagerPortfolio,
  fetchDeveloperDashboard
};
