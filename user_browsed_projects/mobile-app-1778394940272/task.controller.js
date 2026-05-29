const taskService = require('../services/task.service');

const getBoardData = async (req, res) => {
    try {
        const { id } = req.params;
        
        const boardData = await taskService.fetchBoardData(id);
        
        res.json(boardData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAssignedBoardData = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id
        const boardData = await taskService.fetchAssignedBoardData(id, user_id);
        res.json(boardData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getTodayTaskData = async (req, res) => {
    try {
        const user_id = req.user.id
        const boardData = await taskService.fetchTodayTaskData(user_id);
        res.json({ success: true,data: boardData});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateTaskStatus = async (req, res) => {

    try {
        const { taskId } = req.params;
        const { status, position } = req.body;
        
        // Service ko call kiya
        await taskService.updateTaskState(taskId, status, position);
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createTask = async (req, res) => {
    try {
        // req.body mein project_id, title, type, status wgara aayenge
        const newTask = await taskService.createNewTask(req.body);
        res.status(201).json(newTask);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateTaskFields = async (req, res) => {
    try {
        const { taskId } = req.params;
        const updatedData = req.body;

        const updatedTask = await taskService.updateTaskInDB(taskId, updatedData);
        
        if (!updatedTask) {
            return res.status(404).json({ message: "Task not found" });
        }

        res.status(200).json(updatedTask);
    } catch (error) {
        console.error("Error in updateTaskFields Controller:", error);
        res.status(500).json({ message: error.message });
    }
};

const addTaskComment = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { comment_text } = req.body;
        const userId = req.user.id; 

        if (!comment_text || !comment_text.trim()) {
            return res.status(400).json({ message: "Comment text is required" });
        }

        const newComment = await taskService.createComment(taskId, userId, comment_text);
        res.status(201).json(newComment);
    } catch (error) {
        console.error("Error in addTaskComment Controller:", error);
        res.status(500).json({ message: error.message });
    }
};

const getTaskComments = async (req, res) => {
    try {
        const { taskId } = req.params;
        const comments = await taskService.fetchCommentsByTaskId(taskId);
        res.status(200).json(comments);
    } catch (error) {
        console.error("Error in getTaskComments Controller:", error);
        res.status(500).json({ message: error.message });
    }
};


const createSubtask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { title, assigned_to } = req.body; // assigned_to mein user ID aayegi

        if (!title || !title.trim()) {
            return res.status(400).json({ message: "Subtask title is required" });
        }

        const newSubtask = await taskService.addSubtask(taskId, title, assigned_to);
        res.status(201).json(newSubtask);
    } catch (error) {
        console.error("Error in createSubtask Controller:", error);
        res.status(500).json({ message: error.message });
    }
};

const toggleSubtaskStatus = async (req, res) => {
    try {
        const { subtaskId } = req.params;
        const updatedSubtask = await taskService.toggleSubtask(subtaskId);
        
        if (!updatedSubtask) {
            return res.status(404).json({ message: "Subtask not found" });
        }
        res.status(200).json(updatedSubtask);
    } catch (error) {
        console.error("Error in toggleSubtaskStatus Controller:", error);
        res.status(500).json({ message: error.message });
    }
};

const getTaskSubtasks = async (req, res) => {
    try {
        const { taskId } = req.params;
        
        const subtasks = await taskService.fetchSubtasksByTaskId(taskId);
        
        res.status(200).json(subtasks);
    } catch (error) {
        console.error("Error in getTaskSubtasks Controller:", error);
        res.status(500).json({ message: error.message });
    }
};


const getTaskAssignees = async (req, res) => {
    try {
        const { taskId } = req.params;
        const assignees = await taskService.fetchAssigneesByTaskId(taskId);
        res.status(200).json(assignees);
    } catch (error) {
        console.error("Error in getTaskAssignees Controller:", error);
        res.status(500).json({ message: error.message });
    }
};

const toggleTaskAssignee = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { user_id } = req.body; // Kis user ko assign/unassign karna hai

        if (!user_id) {
            return res.status(400).json({ message: "User ID is required" });
        }

        const result = await taskService.toggleAssigneeMapping(taskId, user_id);
        res.status(200).json(result); // result returns { action: 'assigned'/'unassigned' }
    } catch (error) {
        console.error("Error in toggleTaskAssignee Controller:", error);
        res.status(500).json({ message: error.message });
    }
};


const getProjectEpics = async (req, res) => {
    try {
        const { projectId } = req.params;
        const epics = await taskService.fetchEpicsByProjectId(projectId);
        res.status(200).json(epics);
    } catch (error) {
        console.error("Error in getProjectEpics:", error);
        res.status(500).json({ message: error.message });
    }
};

const updateTaskEpic = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { epic_id } = req.body; // Pass null if removing epic

        const updatedTask = await taskService.assignEpicToTask(taskId, epic_id);
        res.status(200).json(updatedTask);
    } catch (error) {
        console.error("Error in updateTaskEpic:", error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getBoardData,
    updateTaskStatus,
    createTask,
    updateTaskFields,
    addTaskComment,
    getTaskComments,
    toggleSubtaskStatus,
    createSubtask,
    getTaskSubtasks,
    getTaskAssignees,
    toggleTaskAssignee,
    getProjectEpics,
    updateTaskEpic,
    getAssignedBoardData,
    getTodayTaskData
};