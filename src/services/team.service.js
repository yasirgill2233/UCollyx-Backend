const { Project, Task, Subtask, User } = require('../models');

const getProjectDashboardData = async (projectId, userId, workpaceId) => {
  console.log("###############",userId, workpaceId)
  try {
    const projectData = await Project.findOne({
      where: {name: projectId, workspace_id: workpaceId },
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
              as: "assignees",
              attributes: ['id', 'full_name', 'email', 'avatar_url'],
              through: { attributes: [] }
            }
          ]
        }
      ],
      order: [
        [Task, 'position', 'ASC']
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

module.exports = {
  getProjectDashboardData,
  getUserAssignedTasks
};