const { Project, User } = require("../models");
const userService = require("../services/user.service");

const getProjUsers = async (req, res) => {
  try {
    const workspaceId = req.user.workspace_id;

    console.log("Workspace ID from token:", req.user);

    const users = await userService.getAllProjUsers(workspaceId);

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Users fetch karne mein masla hua.",
      error: error.message,
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const workspaceId = req.user.workspace_id;
    const members = await userService.getAllUsers(workspaceId);

    const formattedUsers = members.map((member) => {

      const user = member.User ? member.User.get({ plain: true }) : {};

      return {
        id: user.id,
        name: user.full_name,
        email: user.email,
        joined: user.created_at,
        role: member.role,
        status: user.status,
        lastActive: user.last_login ? user.last_login : null,
        team: "Engineering",
        
        projects: user.ProjectMembers?.map(pm => ({
          projectId: pm.project_id,
          projectName: pm.Project?.name || "Unknown Project",
          projectRole: pm.project_role,
          projectJoined: pm.created_at
        })) || []
      };
    });

    res.status(200).json(formattedUsers);
  } catch (error) {
    console.error("Mapping Error:", error);
    res.status(500).json({ message: "Error formatting users data", error: error.message });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;
    
    console.log("Updated data:",userId,status)

    const updated = await userService.updateUserStatus(userId, status);


    if (updated[0] === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: `User status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ message: "Error updating status", error: error.message });
  }
};

const logout = async (req, res) => {
  try {
    const userId = req.user.id;

    await User.update(
      { last_login: null }, 
      { where: { id: userId } }
    );

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Logout failed" });
  }
};

module.exports = {
  getProjUsers,
  getAllUsers,
  toggleUserStatus,
  logout
};
