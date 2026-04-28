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

module.exports = {
  getAllProjUsers,
  getAllUsers,
  updateUserStatus
};
