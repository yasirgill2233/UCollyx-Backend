const projectService = require('../services/project.service');

const createProject = async (req, res) => {

    console.log("Hey................",req.body);
    try {
        const workspaceId = req.user.workspace_id;
        const creatorId = req.user.id;
        const project = await projectService.createProject(req.body, workspaceId, creatorId);
        
        res.status(201).json({ success: true, data: project });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getMyProjects = async (req, res) => {
    try {
        const userId = req.user.id;
        const workspaceId = req.user.workspace_id;

        const projects = await projectService.getUserProjects(userId, workspaceId);
        
        res.status(200).json({ 
            success: true, 
            data: projects 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

const getWorkspaceProjects = async (req, res) => {
    try {
        const workspaceId = req.user.workspace_id;
        const projects = await projectService.getAllWorkspaceProjects(workspaceId);

        console.log("Projects fetched for workspace:", workspaceId, projects);

        const stats = {
            total: projects.length,
            active: projects.filter(p => p.status === 'Active').length,
            noManager: projects.filter(p => !p.manager_id).length,
            archived: projects.filter(p => p.status === 'Archived').length
        };

        res.status(200).json({ success: true, projects, stats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const archiveProject = async (req, res) => {
    try {
        const { id } = req.params;

        const archivedProject = await projectService.archiveProject(id);
        
        if (!archivedProject) {
            return res.status(404).json({ 
                success: false, 
                message: "Project nahi mila" 
            });
        }

        res.status(200).json({
            success: true,
            message: "Project successfully archive ho gaya hai",
            data: archivedProject
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};


const activeProject = async (req, res) => {
    try {
        const { id } = req.params;

        const activeProject = await projectService.activeProject(id);
        
        if (!activeProject) {
            return res.status(404).json({ 
                success: false, 
                message: "Project nahi mila" 
            });
        }

        res.status(200).json({
            success: true,
            message: "Project successfully active ho gaya hai",
            data: activeProject
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};


// const handleUpdateTeam = async (req, res) => {

//     console.log("Hey There:", req.body.members)
//     try {
//         const { id } = req.params; 
//         const { members } = req.body; 

//         await projectService.updateProjectTeam(id, members);

//         res.status(200).json({
//             success: true,
//             message: "Team updated successfully"
//         });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// };


const handleUpdateTeam = async (req, res) => {
    console.log("Hey There:", req.body.members);
    try {
        const { id } = req.params; // Project ID
        const { members } = req.body; // Array of member IDs e.g. [3, 5, 8]

        // 1. Service se team update karwalo
        await projectService.updateProjectTeam(id, members);

        // =========================================================
        // 📡 REAL-TIME DISPATCH: TEAM ALLOCATION UPDATED
        // =========================================================
        if (global.io && members && members.length > 0) {
            try {
                // Project ka name nikal lo notification mein dikhane ke liye
                const project = await Project.findByPk(id, { attributes: ["name"] });
                const projectName = project ? project.name : "New Workspace Context";

                members.forEach((memberId) => {
                    const targetUserRoom = `user_room:${String(memberId)}`;
                    
                    global.io.to(targetUserRoom).emit("project:team_updated", {
                        projectId: id,
                        projectName: projectName,
                        message: `You have been allocated to the project team: "${projectName}".`
                    });
                });
                
                console.log(`📡 [Team Sync Master] Dispatched real-time allocation events to users:`, members);
            } catch (socketErr) {
                console.error("⚠️ Team Update socket emit failed:", socketErr.message);
            }
        }

        res.status(200).json({
            success: true,
            message: "Team updated successfully"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


const getManagerPortfolio = async (req, res, next) => {
  try {
    const managerId = req.user.id; 
    const portfolio = await projectService.fetchManagerPortfolio(managerId);
    return res.status(200).json({
      success: true,
      message: "Manager portfolio matrix synchronized successfully.",
      data: portfolio
    });
  } catch (error) {
    console.error("Error inside getManagerPortfolio Controller:", error);
    next(error);
  }
};

const getProjectDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const projectDetails = await projectService.fetchProjectFullDetails(1);
    
    if (!projectDetails) return res.status(404).json({ message: "Project not found" });

    return res.status(200).json({ success: true, data: projectDetails });
  } catch (error) {
    next(error);
  }
};

module.exports = {
    createProject,
    getWorkspaceProjects,
    archiveProject,
    handleUpdateTeam,
    getMyProjects,
    activeProject,
    getManagerPortfolio,
    getProjectDetails
};