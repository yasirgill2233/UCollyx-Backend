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

const { Op } = require("sequelize");

const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const sendInviteEmail = require("../utils/inviteEmail");
const { request } = require("http");
const { sendApprovalEmail } = require("../utils/sendApprovalEmail");

const getUserWorkspaces = async (userId) => {
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
      role: m.role,
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
  const existing = await WorkspaceMember.findOne({
    where: { user_id: userId, workspace_id: workspace.id },
  });
  if (existing) throw new Error("Already a member of this workspace");

  return await WorkspaceMember.create({
    user_id: userId,
    workspace_id: workspace.id,
    role: role,
    status: "active",
  });
};

const sendJoinRequest = async (userId, workspaceId, role) => {
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
    requested_role: role,
  });
};

const createWorkspace = async (data, ownerId) => {
  const existing = await Workspace.findOne({ where: { slug: data.slug } });
  console.log(existing);
  if (existing) throw new Error("This workspace URL (slug) is already taken.");

  const transaction = await sequelize.transaction();

  try {
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

    await WorkspaceMember.create(
      {
        user_id: ownerId,
        workspace_id: workspace.id,
        role: "org_admin",
        status: "active",
      },
      { transaction },
    );

    await transaction.commit();
    return workspace;
  } catch (error) {
    await transaction.rollback();

    if (data.logo_url) {
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
  console.log(workspaceSlug, emails, inviterName);

  let workspace;
  let invitedBy;
  if (typeof workspaceSlug === "number") {
    workspace = await Workspace.findOne({ where: { id: workspaceSlug } });
    invitedBy = await Workspace.findOne({
      where: { id: workspaceSlug },
      attributes: ["owner_id"],
    });
  } else {
    workspace = await Workspace.findOne({ where: { slug: workspaceSlug } });
    invitedBy = await Workspace.findOne({
      where: { slug: workspaceSlug },
      attributes: ["owner_id"],
    });
  }

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const invitePromises = emails.map(async (email) => {
    if (!emailRegex.test(email)) {
      throw new Error(`Invalid email format ${email}`);
    }

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
        "member",
        secureToken,
      );
    } catch (err) {
      throw new Error(`Failed to send invite to ${email}:`);
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

    await WorkspaceMember.create(
      {
        workspace_id: invite.workspace_id,
        user_id: user.id,
        role: "member",
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
  const invite = await Invitation.findOne({
    where: { token, status: "pending" },
  });

  if (!invite) {
    throw new Error("Invitation link is invalid or has already been used.");
  }

  const user = await User.findOne({
    where: { email: invite.email },
    attributes: ["id", "full_name"],
  });

  return {
    exists: !!user,
    email: invite.email,
  };
};

const fetchDashboardMetrics = async (workspaceId) => {
  console.log("Fetching dashboard metrics for workspace ID:", workspaceId);

  const workspaceInfo = await Workspace.findByPk(workspaceId, {
    attributes: ["name", "slug", "logo_url"],
  });

  const totalUsers = await WorkspaceMember.count({
    where: { workspace_id: workspaceId },
  });

  const developers = await WorkspaceMember.count({
    where: {
      workspace_id: workspaceId,
      role: "dev",
    },
  });

  const workspaceProjects = await Project.findAll({
    where: { workspace_id: workspaceId },
    attributes: ["id"],
  });
  const projectIds = workspaceProjects.map((p) => p.id);

  const managers = await ProjectMember.count({
    distinct: true,
    col: "user_id",
    where: {
      project_id: { [Op.in]: projectIds },
      project_role: "Manager",
    },
  });

  const qa = await WorkspaceMember.count({
    where: {
      workspace_id: workspaceId,
      role: "qa",
    },
  });

  const pendingRequestsCount = await JoinRequest.count({
    where: {
      workspace_id: workspaceId,
      status: "pending",
    },
  });

  const pendingDetails = await JoinRequest.findAll({
    where: { workspace_id: workspaceId, status: "pending" },
    include: [
      { model: User, attributes: ["id", "full_name", "email", "avatar_url"] },
    ],
    order: [["processed_at", "DESC"]],
  });

  const activeProjects = await Project.count({
    where: { workspace_id: workspaceId, status: "Active" },
  });
  const archivedProjects = await Project.count({
    where: { workspace_id: workspaceId, status: "Archived" },
  });

  const projectsWithManagers = await ProjectMember.findAll({
    attributes: ["project_id"],
    where: { project_role: "Manager" },
    raw: true,
  });

  const managerProjectIds = projectsWithManagers.map((p) => p.project_id);

  const withoutManager = await Project.count({
    where: {
      workspace_id: workspaceId,
      id: {
        [Op.notIn]: managerProjectIds.length > 0 ? managerProjectIds : [0],
      },
    },
  });

  return {
    workspace: workspaceInfo,
    users: {
      total: totalUsers,
      pending: pendingRequestsCount,
      developers,
      managers,
      qa,
    },
    projects: {
      active: activeProjects,
      withoutManager,
      archived: archivedProjects,
    },
    pendingList: pendingDetails,
  };
};

const processJoinRequest = async (
  requestId,
  action,
  adminId,
  role,
  fullName,
  email,
) => {
  const request = await JoinRequest.findByPk(requestId);
  if (!request) throw new Error("Join request not found");

  const workspace = await Workspace.findOne({
    where: { id: request.workspace_id },
    attributes: ["name"],
  });

  console.log("Request", request, workspace.name);

  request.status = action;
  request.processed_at = new Date();
  await request.save();

  if (action === "approved") {
    await WorkspaceMember.create({
      workspace_id: request.workspace_id,
      user_id: request.user_id,
      role: role,
      status: "active",
    });

    await sendApprovalEmail({
      email: email,
      full_name: fullName,
      workspace_name: workspace.name,
      role: role,
    });
  }

  return request;
};

const changeMemberRole = async (userId, newRole) => {
  try {
    const [updatedRows] = await WorkspaceMember.update(
      { role: newRole },
      { where: { user_id: userId } },
    );

    if (updatedRows === 0) {
      throw new Error("Member not found or role unchanged");
    }

    return { userId, role: newRole };
  } catch (error) {
    throw error;
  }
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
  changeMemberRole,
};
