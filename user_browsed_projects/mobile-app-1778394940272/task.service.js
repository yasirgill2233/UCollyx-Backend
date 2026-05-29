const {
  Task,
  User,
  Epic,
  TaskComment,
  Subtask,
  TaskAssignee,
} = require("../models");

const { Op } = require("sequelize");


const fetchBoardData = async (projectId) => {
  const tasksFromDb = await Task.findAll({
    where: { project_id: projectId },
    include: [
      {
        model: User,
        as: "assignees",
        attributes: ["id", "full_name", "avatar_url"],
        through: { attributes: [] },
      },
      {
        model: Task,
        as: "ParentTask",
        attributes: ["id", "title"],
      },
    ],
    order: [["position", "ASC"]],
  });

  const tasks = {};
  const columns = {
    backlog: { id: "backlog", title: "Backlog", taskIds: [] },
    todo: { id: "todo", title: "To Do", taskIds: [] },
    inprogress: { id: "inprogress", title: "In Progress", taskIds: [] },
    review: { id: "review", title: "Review", taskIds: [] },
    done: { id: "done", title: "Done", taskIds: [] },
  };

  tasksFromDb.forEach((t) => {
    tasks[t.id] = t;
    if (columns[t.status]) {
      columns[t.status].taskIds.push(t.id);
    }
  });

  return { tasks, columns };
};


const fetchAssignedBoardData = async (projectId, userId) => {
  const tasksFromDb = await Task.findAll({
    where: { project_id: projectId },
    include: [
      {
        model: User,
        as: "assignees",
        attributes: ["id", "full_name", "avatar_url"],
        where: { id: userId },
        through: { attributes: [] },
      },
      {
        model: Task,
        as: "ParentTask",
        attributes: ["id", "title"],
      },
            {
        model: Subtask,
        as: "subtasks",
      },
    ],
    order: [["position", "ASC"]],
  });

  const tasks = {};
  const columns = {
    backlog: { id: "backlog", title: "Backlog", taskIds: [] },
    todo: { id: "todo", title: "To Do", taskIds: [] },
    inprogress: { id: "inprogress", title: "In Progress", taskIds: [] },
    review: { id: "review", title: "Review", taskIds: [] },
    done: { id: "done", title: "Done", taskIds: [] },
  };

  tasksFromDb.forEach((t) => {
    tasks[t.id] = t;
    if (columns[t.status]) {
      columns[t.status].taskIds.push(t.id);
    }
  });

  return { tasks, columns };
};

const fetchTodayTaskData = async (userId) => {
  const startOfDay = new Date("2026-05-15");
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  return await Task.findAll({
    where: {
      due_time: {
        [Op.between]: [startOfDay, endOfDay]
      }
    },
    include: [
      {
        model: User,
        as: "assignees",
        attributes: ["id", "full_name", "avatar_url"],
        where: { id: userId },
        through: { attributes: [] },
      },
      {
        model: Task,
        as: "ParentTask",
        attributes: ["id", "title"],
      },
      {
        model: Subtask,
        as: "subtasks",
      },
    ],
    order: [["position", "ASC"]],
  });
};


const updateTaskState = async (taskId, status, position) => {
  return await Task.update({ status, position }, { where: { id: taskId } });
};

const createNewTask = async (taskData) => {
  const taskCount = await Task.count({
    where: {
      project_id: taskData.project_id,
      status: taskData.status,
    },
  });

  return await Task.create({
    id: `task-${Date.now()}`,
    ...taskData,
    position: taskCount,
  });
};

const updateTaskInDB = async (taskId, updatedData) => {
  const task = await Task.findByPk(taskId);
  if (!task) return null;

  await task.update(updatedData);

  return task;
};

const createComment = async (taskId, userId, commentText) => {
  const comment = await TaskComment.create({
    task_id: taskId,
    user_id: userId,
    content: commentText,
  });

  return await TaskComment.findByPk(comment.id, {
    include: [{ model: User, attributes: ["id", "full_name", "avatar_url"] }],
  });
};

const fetchCommentsByTaskId = async (taskId) => {
  return await TaskComment.findAll({
    where: { task_id: taskId },
    include: [{ model: User, attributes: ["id", "full_name", "avatar_url"] }],
    order: [["created_at", "ASC"]], 
  });
};

const addSubtask = async (taskId, title, assignedTo) => {
  const newSub = await Subtask.create({
    task_id: taskId,
    title: title,
    is_done: false,
    assignee_id: assignedTo || null,
  });

  return await Subtask.findByPk(newSub.id, {
    include: [
      {
        model: User,
        as: "Assignee",
        attributes: ["id", "full_name", "avatar_url"],
      },
    ],
  });
};

const toggleSubtask = async (subtaskId) => {
  const subtask = await Subtask.findByPk(subtaskId);
  if (!subtask) return null;

  subtask.is_done = !subtask.is_done;
  await subtask.save();

  return subtask;
};

const fetchSubtasksByTaskId = async (taskId) => {
  return await Subtask.findAll({
    where: { task_id: taskId },
    include: [
      {
        model: User,
        as: "Assignee",
        attributes: ["id", "full_name", "avatar_url"],
      },
    ],
    order: [["id", "ASC"]],
  });
};

const fetchAssigneesByTaskId = async (taskId) => {
  const taskData = await Task.findByPk(taskId, {
    include: [
      {
        model: User,
        as: "assignees",
        attributes: ["id", "full_name", "avatar_url", "role"],
        through: { attributes: [] },
      },
    ],
  });

  return taskData ? taskData.assignees : [];
};

const toggleAssigneeMapping = async (taskId, userId) => {
  const existingMapping = await TaskAssignee.findOne({
    where: { task_id: taskId, user_id: userId },
  });

  if (existingMapping) {
    await existingMapping.destroy();
    return { action: "unassigned", userId };
  } else {
    await TaskAssignee.create({
      task_id: taskId,
      user_id: userId,
    });
    return { action: "assigned", userId };
  }
};

const fetchEpicsByProjectId = async (projectId) => {
  return await Task.findAll({
    where: { project_id: projectId, type: "epic" },
    order: [["title", "ASC"]],
  });
};

const assignEpicToTask = async (taskId, epicId) => {
  const task = await Task.findByPk(taskId);
  if (!task) throw new Error("Task not found");

  // task.id = epicId;
  task.parent_id = epicId;
  await task.save();

  return task;

  // // Return task with newly attached Epic metadata
  // return await Task.findByPk(taskId, {
  //     include: [{ model: Epic, as: 'Epic' }]
  // });
};

module.exports = {
  fetchBoardData,
  updateTaskState,
  createNewTask,
  updateTaskInDB,
  createComment,
  fetchCommentsByTaskId,
  addSubtask,
  toggleSubtask,
  fetchSubtasksByTaskId,
  fetchAssigneesByTaskId,
  toggleAssigneeMapping,
  fetchEpicsByProjectId,
  assignEpicToTask,
  fetchAssignedBoardData,
  fetchTodayTaskData
};
