const workspaceService = require('../services/workspace.service');

const create = async (req, res) => {
  try {
    const ownerId = req.user.id; 
    const { name, slug, timezone } = req.body;

    const workspaceData = {
      name,
      slug,
      timezone,
      logo_url: req.file ? `/uploads/logos/${req.file.filename}` : null
    };

    const workspace = await workspaceService.createWorkspace(workspaceData, ownerId);

    res.status(201).json({
      success: true,
      message: "Workspace created successfully",
      data: workspace
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getMyWorkspaces = async (req, res) => {
    try {
        const userId = req.user.id;
        const data = await workspaceService.getMyWorkspaces(userId);
        console.log(data)

        res.status(200).json({
            success: true,
            count: data.count,
            workspaces: data.workspaces
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Workspaces fetch karne mein masla hua",
            error: error.message
        });
    }
};

const getWorkspaces = async (req, res) => {
    try {
        const userId = req.user.id;
        const workspaces = await workspaceService.getUserWorkspaces(userId);

        res.status(200).json({
            success: true,
            count: workspaces.length,
            data: workspaces
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Workspaces fetch karne mein masla hua",
            error: error.message
        });
    }
};

const joinWorkspace = async (req, res) => {
    try {
        const { inviteCode, workspaceId, type, role } = req.body;
        const userId = req.user.id;

        console.log(userId, inviteCode, workspaceId, type)

        if (type === 'code') {
            const member = await workspaceService.joinByInviteCode(userId, inviteCode, role);
            return res.status(200).json({ success: true, message: "Joined successfully", data: member });
        } else {
            await workspaceService.sendJoinRequest(userId, workspaceId, role);
            return res.status(200).json({ success: true, message: "Request sent successfully" });
        }
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const inviteMembers = async (req, res) => {
    try {
        const { workspaceSlug, emails, inviterName } = req.body;

        if (!workspaceSlug || !emails || !Array.isArray(emails) || emails.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Workspace slug and a list of emails are required." 
            });
        }

        await workspaceService.sendBulkInvites({
            workspaceSlug,
            emails,
            inviterName: inviterName || "A Team Member"
        });

        res.status(200).json({ 
            success: true, 
            message: "Invitations are being processed and sent." 
        });

    } catch (error) {
        console.log(error.message)
        console.log(error.message);
    
    let statusCode = 500;
    
    if (error.message.includes("Workspace not found")) {
        statusCode = 404;
    } else if (error.message.includes("Invalid email format")) {
        statusCode = 400; // Client-side error
    }
        res.status(statusCode).json({ 
            success: false, 
            message: error.message 
        });
    }
};

const acceptInvite = async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token) {
            return res.status(400).json({ success: false, message: "Token is required." });
        }

        const workspace = await workspaceService.acceptInvitation(token, password);

        res.status(200).json({
            success: true,
            message: "Successfully joined the workspace!",
            data: { slug: workspace.slug }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const checkInvitation = async (req, res) => {
    try {
        const { token } = req.params;

        console.log(token)

        if (!token) {
            return res.status(400).json({ success: false, message: "Token is required." });
        }

        const data = await workspaceService.checkInviteStatus(token);

        res.status(200).json({
            success: true,
            data: data
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const getDashboardStats = async (req, res) => {
    try {
        const { workspaceId } = req.params;

        if (!workspaceId) {
            return res.status(400).json({ success: false, message: "Workspace ID is required" });
        }

        const stats = await workspaceService.fetchDashboardMetrics(workspaceId);

        res.status(200).json({
            success: true,
            message: "Dashboard stats fetched successfully",
            data: stats
        });
    } catch (error) {
        console.error("Dashboard Controller Error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Internal Server Error while fetching stats" 
        });
    }
};

const handleJoinAction = async (req, res) => {
    try {
        const { requestId, action, role, fullName, email } = req.body; 
        const adminId = req.user.id; 

        if (!['approved', 'rejected'].includes(action)) {
            return res.status(400).json({ success: false, message: "Invalid action" });
        }

        await workspaceService.processJoinRequest(requestId, action, adminId, role, fullName, email);

        res.status(200).json({
            success: true,
            message: `User request has been ${action} successfully.`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateMemberRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    console.log(role, userId)

    const result = await workspaceService.changeMemberRole(userId, role);
    
    return res.status(200).json({ 
      message: "Role updated successfully", 
      data: result 
    });
  } catch (error) {
    console.error("Controller Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
    getMyWorkspaces,
    joinWorkspace,
    create,
    inviteMembers,
    acceptInvite,
    getWorkspaces,
    checkInvitation,
    getDashboardStats,
    handleJoinAction,
    updateMemberRole
};