const workspaceService = require('../services/workspace.service');

const create = async (req, res) => {
  try {
    const ownerId = req.user.id; // Auth middleware se milega
    const { name, slug, timezone } = req.body;

    const workspaceData = {
      name,
      slug,
      timezone,
      logo_url: req.file ? `/uploads/logos/${req.file.filename}` : null
    };

    const workspace = await workspaceService.createWorkspace(workspaceData, ownerId);

    // Note: Invited emails ka logic yahan handle ho sakta hai (Email service call)
    // const invitedEmails = JSON.parse(req.body.invitedEmails || "[]");

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
        const userId = req.user.id; // Auth middleware se user id milegi
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
        const userId = req.user.id; // Auth middleware se user id milegi
        const workspaces = await workspaceService.getUserWorkspaces(userId);
        // console.log(workspaces)

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
        const { inviteCode, workspaceId, type, role } = req.body; // type: 'code' or 'request'
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

        // Validation
        if (!workspaceSlug || !emails || !Array.isArray(emails) || emails.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Workspace slug and a list of emails are required." 
            });
        }

        // Service call
        await workspaceService.sendBulkInvites({
            workspaceSlug,
            emails,
            inviterName: inviterName || "A Team Member"
        });

        // Hum foran response bhej dete hain kyunke emails background mein ja rahi hain
        res.status(200).json({ 
            success: true, 
            message: "Invitations are being processed and sent." 
        });

    } catch (error) {
        const statusCode = error.message === "Workspace not found" ? 404 : 500;
        res.status(statusCode).json({ 
            success: false, 
            message: error.message 
        });
    }
};

const acceptInvite = async (req, res) => {
    try {
        const { token, password } = req.body;
        // const userId = req.user.id; // Protect middleware se

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
        const { token } = req.params; // URL se token uthayenge

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

        // Business Logic: Check if workspaceId exists or user has access
        if (!workspaceId) {
            return res.status(400).json({ success: false, message: "Workspace ID is required" });
        }

        // Service call to get data
        const stats = await workspaceService.fetchDashboardMetrics(workspaceId);

        // Response formatting
        res.status(200).json({
            success: true,
            message: "Dashboard stats fetched successfully",
            data: stats
        });
    } catch (error) {
        // Error handling logic
        console.error("Dashboard Controller Error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Internal Server Error while fetching stats" 
        });
    }
};

const handleJoinAction = async (req, res) => {
    try {
        const { requestId, action, role, fullName, email } = req.body; // action: 'approved' | 'rejected'
        const adminId = req.user.id; // Protect middleware se mil raha hai [cite: 6]

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

module.exports = {
    getMyWorkspaces,
    joinWorkspace,
    create,
    inviteMembers,
    acceptInvite,
    getWorkspaces,
    checkInvitation,
    getDashboardStats,
    handleJoinAction
};