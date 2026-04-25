const projectService = require('../services/project.service');

const createProject = async (req, res) => {

    console.log("Hey................",req.body);
    try {
        const workspaceId = req.user.workspace_id;
        const project = await projectService.createProject(req.body, workspaceId);
        
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


const handleUpdateTeam = async (req, res) => {

    console.log("Hey There:", req.body.members)
    try {
        const { id } = req.params; 
        const { members } = req.body; 

        await projectService.updateProjectTeam(id, members);

        res.status(200).json({
            success: true,
            message: "Team updated successfully"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createProject,
    getWorkspaceProjects,
    archiveProject,
    handleUpdateTeam,
    getMyProjects,
    activeProject
};