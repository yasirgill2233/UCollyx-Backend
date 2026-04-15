const { User, WorkspaceMember, Workspace } = require('../models');
const {Op} = require('sequelize')

// Workspace ke tamam active users lane ke liye
const getAllWorkspaceUsers = async (workspaceId) => {
    try {
        const users = await User.findAll({
           
            include: [{
                model: Workspace,
                through: {
                    where:{
                        role: {[Op.ne]: 'member'}
                    },
                    attributes:[]
                },
                required: true,
                attributes:[]
            }],
            distinct: true,
            attributes: ['id', 'full_name', 'email', 'avatar_url', 'role'], // Sensitive data (password) exclude kiya
            order: [['full_name', 'ASC']]
        });
        return users;
    } catch (error) {
        throw error;
    }
};

module.exports = {
    getAllWorkspaceUsers
};