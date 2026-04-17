const {
  Workspace,
  WorkspaceMember,
  JoinRequest,
  sequelize,
  Invitation,
  User,
  Project,
  ProjectMember,
} = require("../models");

// const {  SystemAlert, ActivityLog } = require('../models');
const { Op } = require("sequelize");

const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const sendInviteEmail = require("../utils/inviteEmail");
const { request } = require("http");
const { sendApprovalEmail } = require("../utils/sendApprovalEmail");

const getUserWorkspaces = async (userId) => {
  // User jin workspaces ka member hai unki details fetch karna
  const memberships = await WorkspaceMember.findAll({
    include: [
      {
        model: Workspace,
        attributes: ["id", "name", "slug", "logo_url"],
      },
    ],
  });

  return (uniqueWorkspaces = Array.from(
    new Map(memberships.map((m) => [m.Workspace.id, m.Workspace])).values(),
  ));
};

const getMyWorkspaces = async (userId) => {
  // User jin workspaces ka member hai unki details fetch karna
  const memberships = await WorkspaceMember.findAll({
    where: { user_id: userId },
    include: [
      {
        model: Workspace,
        attributes: ["id", "name", "slug", "logo_url"],
        required: true,
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return {
    count: memberships.length,
    workspaces: memberships.map((m) => ({
      id: m.Workspace.id,
      name: m.Workspace.name,
      slug: m.Workspace.slug,
      logo_url: m.Workspace.logo_url,
      role: m.role, // Member ka apna role (admin/dev)
    })),
  };
};

const joinByInviteCode = async (userId, inviteCode, role) => {
  console.log(role);
  const workspace = await Workspace.findOne({
    where: { invite_code: inviteCode },
  });
  if (!workspace) throw new Error("Invalid invite code");

  console.log(userId, inviteCode, workspace.id);
  // Check karein user pehle se member to nahi?
  // const wid = await WorkspaceMember.findOne({ where: { workspace_id: workspace.id } });
  const existing = await WorkspaceMember.findOne({
    where: { user_id: userId, workspace_id: workspace.id },
  });
  if (existing) throw new Error("Already a member of this workspace");

  // Member banayein (Default role: developer ya member)
  return await WorkspaceMember.create({
    user_id: userId,
    workspace_id: workspace.id,
    role: role, // Default role
    status: "active",
  });
};

const sendJoinRequest = async (userId, workspaceId, role) => {
  console.log("Now Check the Role:",userId, workspaceId, role);
  const existingRequest = await JoinRequest.findOne({
    where: { user_id: userId, workspace_id: workspaceId, status: "pending" },
  });
  if (existingRequest) throw new Error("Request already sent and is pending");

  const apprvoedRequest = await JoinRequest.findOne({
    where: { user_id: userId, workspace_id: workspaceId, status: "approved" },
  });

  if (apprvoedRequest)
    throw new Error("Request is approved by admin please login");

  const rejectedRequest = await JoinRequest.findOne({
    where: { user_id: userId, workspace_id: workspaceId, status: "rejected" },
  });

  if (rejectedRequest) throw new Error("Request is rejected by admin");

  return await JoinRequest.create({
    user_id: userId,
    workspace_id: workspaceId,
    status: "pending",
    requested_role: role, // User jo role chah raha hai (dev/manager/qa/member)
  });
};

const createWorkspace = async (data, ownerId) => {
  // Check if slug already exists
  const existing = await Workspace.findOne({ where: { slug: data.slug } });
  console.log(existing);
  if (existing) throw new Error("This workspace URL (slug) is already taken.");

  const transaction = await sequelize.transaction();

  try {
    // 1. Create Workspace
    const workspace = await Workspace.create(
      {
        name: data.name,
        slug: data.slug,
        timezone: data.timezone,
        logo_url: data.logo_url,
        owner_id: ownerId,
        invite_code: crypto.randomBytes(4).toString("hex").toUpperCase(),
      },
      { transaction },
    );

    console.log(workspace);

    // 2. Add Creator as Organization Admin
    await WorkspaceMember.create(
      {
        user_id: ownerId,
        workspace_id: workspace.id,
        role: "org_admin", // UCollyx roles ke mutabiq
        status: "active",
      },
      { transaction },
    );

    await transaction.commit();
    return workspace;
  } catch (error) {
    await transaction.rollback();

    if (data.logo_url) {
      // Path ko project root ke mutabiq set karein
      const filePath = path.join(__dirname, "../../", data.logo_url);

      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting file during cleanup:", err);
        else console.log("Cleanup successful: Unused logo deleted.");
      });
    }

    throw error;
  }
};

const sendBulkInvites = async ({ workspaceSlug, emails, inviterName }) => {
  // 1. Workspace find karein
  const workspace = await Workspace.findOne({ where: { slug: workspaceSlug } });
  const invitedBy = await Workspace.findOne({
    where: { slug: workspaceSlug },
    attributes: ["owner_id"],
  });

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  // 2. Emails send karein
  // Hum map use kar rahe hain taake saari promises ka track rakha ja sake
  const invitePromises = emails.map(async (email) => {
    try {
      const secureToken = crypto.randomBytes(32).toString("hex");

      await Invitation.upsert({
        workspace_id: workspace.id,
        invited_by: workspace.owner_id,
        email: email,
        token: secureToken,
      });
      return await sendInviteEmail(
        email,
        workspace.name,
        inviterName,
        "Developer", // Aap isay dynamic bhi bana sakte hain
        secureToken,
      );
    } catch (err) {
      console.error(`Failed to send invite to ${email}:`, err.message);
      return null;
    }
  });

  await Promise.all(invitePromises);

  return { success: true };
};

const acceptInvitation = async (token, password = null) => {
  const transaction = await sequelize.transaction();
  console.log("Password:", password);
  try {
    const invite = await Invitation.findOne({
      where: { token, status: "pending" },
      transaction,
    });
    if (!invite) throw new Error("Invite not found");

    let user = await User.findOne({
      where: { email: invite.email },
      transaction,
    });

    if (!user) {
      // Naya user hai, password hona lazmi hai
      if (!password) throw new Error("Password is required for new users.");
      const hashedPassword = await bcrypt.hash(password, 12);
      user = await User.create(
        {
          email: invite.email,
          password: hashedPassword,
          full_name: invite.email.split("@")[0],
          is_verified: true,
          status: "active",
        },
        { transaction },
      );
    }

    // Sirf membership add karein (Dono cases mein yehi hoga)
    await WorkspaceMember.create(
      {
        workspace_id: invite.workspace_id,
        user_id: user.id,
        role: "dev",
      },
      { transaction },
    );

    await Invitation.update(
      { status: "accepted" },
      { where: { token, status: "pending" }, transaction },
    );

    await transaction.commit();
    return user;
  } catch (error) {
    await transaction.rollback();
    console.log(error);
    throw error;
  }
};

const checkInviteStatus = async (token) => {
  // 1. Pehle invite dhundein aur workspace ki details bhi saath lein
  const invite = await Invitation.findOne({
    where: { token, status: "pending" },
  });

  if (!invite) {
    throw new Error("Invitation link is invalid or has already been used.");
  }

  // 2. Check karein ke ye email pehle se User table mein hai?
  const user = await User.findOne({
    where: { email: invite.email },
    attributes: ["id", "full_name"],
  });

  return {
    exists: !!user, // boolean: true/false
    email: invite.email,
  };
};

const fetchDashboardMetrics = async (workspaceId) => {
  console.log("Fetching dashboard metrics for workspace ID:", workspaceId);
  // 1. Users Metrics (Schema Tables: users, workspace_members) [cite: 4, 17]

  const workspaceInfo = await Workspace.findByPk(workspaceId, {
        attributes: ['name', 'slug', 'logo_url'] // 
    });
    
  const totalUsers = await WorkspaceMember.count({
    where: { workspace_id: workspaceId },
  });

  // Developers count karne ka sahi aur asaan tarika
  const developers = await WorkspaceMember.count({
    where: {
      workspace_id: workspaceId,
      role: "dev", // Agar role workspace_members table mein hai [cite: 19]
    },
  });

  // Hum un projects ke IDs nikalenge jo is workspace ke hain
    const workspaceProjects = await Project.findAll({ 
        where: { workspace_id: workspaceId },
        attributes: ['id']
    });
    const projectIds = workspaceProjects.map(p => p.id);

    const managers = await ProjectMember.count({
        distinct: true,
        col: 'user_id',
        where: { 
            project_id: { [Op.in]: projectIds },
            project_role: 'Manager' // Check karein 'M' capital hai ya small
        }
    });
    

  const qa = await WorkspaceMember.count({
    where: { 
      workspace_id: workspaceId, 
      role: "qa" 
    },
  });

  // 1. Pending Join Requests count 
    const pendingRequestsCount = await JoinRequest.count({ 
        where: { 
            workspace_id: workspaceId, 
            status: 'pending' 
        } 
    });

    // 2. Pending Requests ki detail (List) taake dashboard par dikha sakein
    const pendingDetails = await JoinRequest.findAll({
        where: { workspace_id: workspaceId, status: 'pending' },
        include: [{ model: User, attributes: ['id', 'full_name', 'email', 'avatar_url'] }],
        order: [['processed_at', 'DESC']]
    });

  // 2. Projects Metrics (Schema Table: projects) [cite: 27]
  const activeProjects = await Project.count({
    where: { workspace_id: workspaceId, status: "Active" },
  });
  const archivedProjects = await Project.count({
    where: { workspace_id: workspaceId, status: "Archived" },
  });

  const projectsWithManagers = await ProjectMember.findAll({
        attributes: ['project_id'],
        where: { project_role: 'Manager' }, // Case-sensitive: Check if it's 'Manager' or 'manager'
        raw: true
    });

    const managerProjectIds = projectsWithManagers.map(p => p.project_id);

 const withoutManager = await Project.count({
        where: {
            workspace_id: workspaceId,
            id: {
                [Op.notIn]: managerProjectIds.length > 0 ? managerProjectIds : [0] 
            }
        }
    });

  // 3. System Alerts & Logs (Schema Tables: system_alerts, activity_logs) [cite: 121, 97]
  // const alertCount = await SystemAlert.count({
  //     where: { workspace_id: workspaceId, is_resolved: false }
  // });

  // const logs = await ActivityLog.findAll({
  //     where: { org_id: workspaceId },
  //     limit: 5,
  //     order: [['created_at', 'DESC']],
  //     include: [{ model: User, as: 'actor', attributes: ['full_name'] }] // [cite: 6, 99]
  // });

  return {
    workspace: workspaceInfo, // Ab name yahan se jayega
    users: { 
      total: totalUsers, 
      pending: pendingRequestsCount, 
      developers, 
      managers, 
      qa },
    projects: {
      active: activeProjects,
      withoutManager,
      archived: archivedProjects,
    },
    pendingList: pendingDetails,
    // alerts: { withoutRoles: alertCount, conflicts: 0 },
    // recentActions: logs
  };
};

const processJoinRequest = async (requestId, action, adminId, role, fullName, email) => {

  const request = await JoinRequest.findByPk(requestId);
  if (!request) throw new Error("Join request not found");

  const workspace = await Workspace.findOne({
    where: { id: request.workspace_id },
    attributes: ['name']
  });
  
  console.log("Request",request, workspace.name);

    // Status update (approved/rejected) 
    request.status = action;
    request.processed_at = new Date();
    await request.save();

    if (action === 'approved') {
        // User ko workspace ka member banana 
        await WorkspaceMember.create({
            workspace_id: request.workspace_id,
            user_id: request.user_id,
            role: role, 
            status: 'active'
        });

        await sendApprovalEmail({
        email: email,
        full_name: fullName,
        workspace_name: workspace.name,
        role: role
    });
    }

    // Activity log entry taake timeline par nazar aaye 
    // await ActivityLog.create({
    //     org_id: request.workspace_id,
    //     actor_id: adminId,
    //     action_type: `MEMBER_${action.toUpperCase()}`,
    //     description: `Admin ${action} a join request for user ID: ${request.user_id}`
    // });

    return request;
};

module.exports = {
  getUserWorkspaces,
  joinByInviteCode,
  sendJoinRequest,
  createWorkspace,
  sendBulkInvites,
  acceptInvitation,
  getMyWorkspaces,
  checkInviteStatus,
  fetchDashboardMetrics,
  processJoinRequest,
  // baaqi functions...
};
