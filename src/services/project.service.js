const { Project, ProjectMember, User, sequelize } = require('../models');

// 1. Create Project Function
const createProject = async (projectData, workspaceId) => {
    const t = await sequelize.transaction();
    console.log("Check is there any role",projectData)
    try {
        // Unique Code aur Slug backend par generate karein
        const code = `PROJ-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
        const slug = projectData.name.toLowerCase().split(' ').join('-') + '-' + Date.now();

        const project = await Project.create({
            ...projectData,
            workspace_id: workspaceId,
            code,
            slug
        }, { transaction: t });

        // Agar manager select kiya gaya hai, to usay automatic member banayein
        if (projectData.manager_id) {
            await ProjectMember.create({
                project_id: project.id,
                user_id: projectData.manager_id,
                project_role: 'Member' // Default role
            }, { transaction: t });
        }

        await t.commit();
        return project;
    } catch (error) {
        await t.rollback();
        throw error;
    }
};

// 2. Get All Projects Function
const getAllProjects = async (workspaceId) => {
    return await Project.findAll({
        where: { workspace_id: workspaceId },
        include: [
            { model: User, as: 'manager', attributes: ['id', 'full_name', 'avatar_url'] },
            { model: User, as: 'members', through: { attributes: ['project_role'] } }
        ],
        order: [['created_at', 'DESC']]
    });
};

const archiveProject = async (projectId) => {
    try {
        const project = await Project.findByPk(projectId);
        
        if (!project) {
            return null; // Controller handle karega agar project na mila
        }

        // Status update
        project.status = 'ARCHIVED';
        await project.save();

        return project;
    } catch (error) {
        throw new Error("Service Error: Project archive nahi ho saka - " + error.message);
    }
};


const updateProjectTeam = async (projectId, members) => {
    console.log("this is the role that we need",members[0]?.role)
    try {
        // 1. Pehle purane members delete karein
        await ProjectMember.destroy({ 
            where: { project_id: projectId } 
        });


        // 2. Agar members hain toh bulk insert karein
        if (members && members.length > 0) {
            const memberData = members.map(m => ({
                project_id: projectId,
                user_id: m?.id, // Ensure karein frontend se 'id' aa rahi hai
                project_role: m?.role
            }));

            return await ProjectMember.bulkCreate(memberData);
        }
        
        return true;
    } catch (error) {
        console.error("Service Error:", error);
        throw error;
    }
};


module.exports = {
    createProject,
    getAllProjects,
    archiveProject,
    updateProjectTeam
};