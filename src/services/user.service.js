const { User, WorkspaceMember, Workspace, sequelize, ProjectMember, Project } = require("../models");
const { Op } = require("sequelize");

const getAllProjUsers = async (workspaceId) => {
  return await User.findAll({
    include: [
      {
        model: Workspace,
        through: {
          where: {
            role: { [Op.ne]: "org_admin" },
            workspace_id: workspaceId,
          },
          attributes: [],
        },
        required: true,
        attributes: [],
      },
    ],
    distinct: true,
    attributes: ["id", "full_name", "email", "avatar_url", "role"],
    order: [["full_name", "ASC"]],
  });
};

const getAllUsers = async (workspaceId) => {
  return await WorkspaceMember.findAll({
    where: { 
      workspace_id: workspaceId,
      role: { [Op.ne]: 'org_admin'}
     },
    include: [
      {
        model: User,
        attributes: ["id", "full_name", "email", "status", "last_login", "created_at"],
        include: [{
          model: ProjectMember,
          include: [{ model: Project, attributes: ['name'] }]
        }]
      },
    ],
    attributes: ["id", "role", "user_id"],
    order: [
      [
        sequelize.literal(`CASE 
            WHEN WorkspaceMember.role = 'org_admin' THEN 1 
            ELSE 2 
        END`),
        "ASC",
      ],
      [User, "full_name", "ASC"],
    ],
  });
};

const updateUserStatus = async (userId, newStatus) => {
  return await User.update(
    { status: newStatus },
    { where: { id: userId } }
  );
};


const updateProfile = async (userId, data) => {
  // 1. User find karein
  const user = await User.findByPk(userId);
  if (!user) throw new Error('User not found');

  // 2. Data update karein
  if (data.full_name) user.full_name = data.full_name;
  if (data.phone) user.phone = data.phone;
  if (data.avatar_url) user.avatar_url = data.avatar_url;

  await user.save();

  return user;
};

module.exports = {
  getAllProjUsers,
  getAllUsers,
  updateUserStatus,
  updateProfile
};
