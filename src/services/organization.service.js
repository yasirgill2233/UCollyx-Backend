const { Op } = require("sequelize");
const { Workspace, sequelize, User, Tenant, WorkspaceMember } = require("../models");


const getMembersByWorkspaceId = async (workspaceId) => {
  return await WorkspaceMember.findAll({
    where: { 
      workspace_id: workspaceId 
    },
    include: [
      {
        model: User,
        attributes: ["id", "full_name", "email", "status"]
      }
    ],
    order: [["joined_at", "DESC"]] // Newest members top par aayenge
  });
};

// 1. Fetch All Workspaces with dynamic metrics and joins
const getAllOrganizations = async (filters) => {
  const { searchTerm, status } = filters;
  let whereClause = {};

  if (status && status !== "All") {
    whereClause.status = status.toLowerCase(); // DB side lowercase handle karega ('active', 'suspended')
  }

  if (searchTerm) {
    whereClause.name = { [Op.like]: `%${searchTerm}%` };
  }

  return await Workspace.findAll({
    where: whereClause,
    include: [
      { model: User, attributes: ["full_name", "email"] }
    ],
    attributes: {
      include: [
        // Subqueries to fetch active database counts dynamically
        [
          sequelize.literal(`(SELECT COUNT(*) FROM workspace_members WHERE workspace_members.workspace_id = Workspace.id)`),
          "totalUsers"
        ],
        [
          sequelize.literal(`(SELECT COUNT(*) FROM projects WHERE projects.workspace_id = Workspace.id)`),
          "totalProjects"
        ]
      ]
    },
    order: [["created_at", "DESC"]]
  });
};

// 2. Transaction based safe Workspace creation
const createOrganization = async (orgData) => {
  const transaction = await sequelize.transaction();
  try {
    // 1. Check if the admin user exists in users table
    const owner = await User.findOne({ where: { email: orgData.adminEmail } });
    if (!owner) throw new Error("Admin email user not found in database.");

    const slug = orgData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    // 2. Insert into workspaces table
    const newWorkspace = await Workspace.create({
      name: orgData.name,
      slug: slug,
      status: orgData.status.toLowerCase(),
      owner_id: owner.id,
      timezone: "UTC"
    }, { transaction });

    // 3. Insert into tenants table
    const randomOrgId = `ORG-${Math.floor(Math.random() * 900) + 100}`;
    await Tenant.create({
      id: randomOrgId,
      workspace_id: newWorkspace.id,
      plan_type: orgData.plan.toLowerCase(),
      max_users: parseInt(orgData.maxUsers) || 10,
      usage_limit_gb: orgData.plan.toLowerCase() === "enterprise" ? 100 : 5
    }, { transaction });

    await transaction.commit();
    return newWorkspace;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// 3. Status Updation (Active / Suspend / Reactivate)
const updateStatus = async (workspaceId, status) => {
  const workspace = await Workspace.findByPk(workspaceId);
  if (!workspace) throw new Error("Workspace record not found");

  workspace.status = status.toLowerCase();
  return await workspace.save();
};

// Direct Named Functions Export
module.exports = {
  getAllOrganizations,
  createOrganization,
  updateStatus,
  getMembersByWorkspaceId
};