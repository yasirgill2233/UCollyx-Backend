const { Project, Task, Subtask, User } = require('../models'); // Apne models ka sahi path dein

/**
 * Kisi specific Project ka poora data uske Tasks, Subtasks aur Assignees ke sath nikalne ke liye
 */
const getProjectDashboardData = async (projectId, userId, workpaceId) => {
  console.log(userId, workpaceId)
  try {
    const projectData = await Project.findOne({
      where: {id: projectId, workspace_id: workpaceId },
      attributes: ['id', 'name', 'code', 'slug', 'status', 'progress', 'folder_path'],
      include: [
        {
          model: Task,
          attributes: ['id', 'title', 'description', 'status', 'priority', 'type', 'position', 'due_time'],
          include: [
            {
              model: Subtask,
              as: 'subtasks',
              attributes: ['id', 'title', 'is_done', 'assignee_id'],
            },
            {
              model: User,
              as: "assignees", // Jo association file mein alias rakha tha
              attributes: ['id', 'full_name', 'email', 'avatar_url'],
              through: { attributes: [] } // Composite table data hide karne ke liye
            }
          ]
        }
      ],
      order: [
        [Task, 'position', 'ASC'] // Kanban board sorting ke liye
      ]
    });

    if (!projectData) {
      throw new Error("Project not found!");
    }

    return projectData;
  } catch (error) {
    console.error("Error in getProjectDashboardData Service:", error.message);
    throw error;
  }
};

/**
 * Kisi User ke saare assigned tasks dekhne ke liye (For Today's Focus/My Tasks)
 */
const getUserAssignedTasks = async (userId) => {
  try {
    const userTasks = await User.findOne({
      where: { id: userId },
      attributes: ['id', 'full_name', 'email'],
      include: [
        {
          model: Task,
          attributes: ['id', 'title', 'status', 'priority', 'due_time', 'project_id'],
          include: [
            {
              model: Project,
              attributes: ['id', 'name', 'code']
            },
            {
              model: Subtask,
              attributes: ['id', 'title', 'is_done']
            }
          ]
        }
      ]
    });

    return userTasks;
  } catch (error) {
    console.error("Error in getUserAssignedTasks Service:", error.message);
    throw error;
  }
};

// Functions ko direct export kar do
module.exports = {
  getProjectDashboardData,
  getUserAssignedTasks
};