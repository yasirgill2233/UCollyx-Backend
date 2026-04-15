const { Project } = require('../models');
const userService = require('../services/user.service');

const getAllUsers = async (req, res) => {
    try {
        // Auth middleware se workspace_id nikalna
        const workspaceId = req.user.workspace_id; 

        console.log("Workspace ID from token:", req.user);
        
        const users = await userService.getAllWorkspaceUsers(workspaceId);
        
        res.status(200).json({
            success: true,
            users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Users fetch karne mein masla hua.",
            error: error.message
        });
    }
};

module.exports = {
    getAllUsers
};