const {
  Workspace,
  WorkspaceMember,
  JoinRequest,
  sequelize,
  Invitation,
  User,
} = require("../models");
const crypto = require("crypto");
const bcrypt = require('bcryptjs');
const sendInviteEmail = require("../utils/inviteEmail");

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

  return uniqueWorkspaces = Array.from(
  new Map(memberships.map(m => [m.Workspace.id, m.Workspace])).values()
);
};

const getMyWorkspaces = async (userId) => {
  // User jin workspaces ka member hai unki details fetch karna
  const memberships = await WorkspaceMember.findAll({
    where: { user_id: userId },
    include: [
      {
        model: Workspace,
        attributes: ["id", "name", "slug", "logo_url"],
        required: true
      },
    ],
    order: [['createdAt', 'DESC']]
  });

  return {
        count: memberships.length,
        workspaces: memberships.map(m => ({
            id: m.Workspace.id,
            name: m.Workspace.name,
            slug: m.Workspace.slug,
            logo_url: m.Workspace.logo_url,
            role: m.role // Member ka apna role (admin/dev)
        }))
    };
};

const joinByInviteCode = async (userId, inviteCode, role) => {
  console.log(role)
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
  console.log(userId, workspaceId);
  const existingRequest = await JoinRequest.findOne({
    where: { user_id: userId, workspace_id: workspaceId, status: "pending" },
  });
  if (existingRequest) throw new Error("Request already sent and is pending");

  const apprvoedRequest = await JoinRequest.findOne({
    where: { user_id: userId, workspace_id: workspaceId, status: "approved" },
  });

  if (apprvoedRequest) throw new Error("Request is approved by admin please login");

  const rejectedRequest = await JoinRequest.findOne({
    where: { user_id: userId, workspace_id: workspaceId, status: "rejected" },
  });

  if (rejectedRequest) throw new Error("Request is rejected by admin");

  return await JoinRequest.create({
    user_id: userId,
    workspace_id: workspaceId,
    status: "pending",
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
        secureToken
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
    console.log('Password:',password)
    try {
        const invite = await Invitation.findOne({ where: { token, status: 'pending' }, transaction });
        if (!invite) throw new Error("Invite not found");

        let user = await User.findOne({ where: { email: invite.email }, transaction });

        if (!user) {
            // Naya user hai, password hona lazmi hai
            if (!password) throw new Error("Password is required for new users.");
            const hashedPassword = await bcrypt.hash(password, 12);
            user = await User.create({
                email: invite.email,
                password: hashedPassword,
                full_name: invite.email.split('@')[0],
                is_verified: true,
                status: 'active'
            }, { transaction });
        }

        // Sirf membership add karein (Dono cases mein yehi hoga)
        await WorkspaceMember.create({
            workspace_id: invite.workspace_id,
            user_id: user.id,
            role: 'dev'
        }, { transaction });

        await Invitation.update(
            { status: 'accepted' }, 
            { where: {token, status: 'pending' }, transaction }
        );

        await transaction.commit();
        return user;
    } catch (error) {
        await transaction.rollback();
        console.log(error)
        throw error;
    }
};

const checkInviteStatus = async (token) => {
    // 1. Pehle invite dhundein aur workspace ki details bhi saath lein
    const invite = await Invitation.findOne({ 
        where: { token, status: 'pending' }
    });

    if (!invite) {
        throw new Error("Invitation link is invalid or has already been used.");
    }

    // 2. Check karein ke ye email pehle se User table mein hai?
    const user = await User.findOne({ 
        where: { email: invite.email },
        attributes: ['id', 'full_name'] 
    });

    return {
        exists: !!user, // boolean: true/false
        email: invite.email,
    };
};

module.exports = {
  getUserWorkspaces,
  joinByInviteCode,
  sendJoinRequest,
  createWorkspace,
  sendBulkInvites,
  acceptInvitation,
  getMyWorkspaces,
  checkInviteStatus
  // baaqi functions...
};
