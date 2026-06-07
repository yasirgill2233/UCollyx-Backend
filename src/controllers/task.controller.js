// const taskService = require('../services/task.service');

// const getBoardData = async (req, res) => {
//     try {
//         const { id } = req.params;
        
//         const boardData = await taskService.fetchBoardData(id);
        
//         res.json(boardData);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

// const getAssignedBoardData = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const user_id = req.user.id
//         const boardData = await taskService.fetchAssignedBoardData(id, user_id);
//         res.json(boardData);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

// const getTodayTaskData = async (req, res) => {
//     try {
//         const user_id = req.user.id
//         const boardData = await taskService.fetchTodayTaskData(user_id);
//         res.json({ success: true,data: boardData});
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

// const updateTaskStatus = async (req, res) => {

//     try {
//         const { taskId } = req.params;
//         const { status, position } = req.body;
        
//         // Service ko call kiya
//         await taskService.updateTaskState(taskId, status, position);
        
//         res.json({ success: true });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// };

// const createTask = async (req, res) => {
//     try {
//         // req.body mein project_id, title, type, status wgara aayenge
//         const newTask = await taskService.createNewTask(req.body);
//         res.status(201).json(newTask);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

// const updateTaskFields = async (req, res) => {
//     try {
//         const { taskId } = req.params;
//         const updatedData = req.body;

//         const updatedTask = await taskService.updateTaskInDB(taskId, updatedData);
        
//         if (!updatedTask) {
//             return res.status(404).json({ message: "Task not found" });
//         }

//         res.status(200).json(updatedTask);
//     } catch (error) {
//         console.error("Error in updateTaskFields Controller:", error);
//         res.status(500).json({ message: error.message });
//     }
// };

// const addTaskComment = async (req, res) => {
//     try {
//         const { taskId } = req.params;
//         const { comment_text } = req.body;
//         const userId = req.user.id; 

//         if (!comment_text || !comment_text.trim()) {
//             return res.status(400).json({ message: "Comment text is required" });
//         }

//         const newComment = await taskService.createComment(taskId, userId, comment_text);
//         res.status(201).json(newComment);
//     } catch (error) {
//         console.error("Error in addTaskComment Controller:", error);
//         res.status(500).json({ message: error.message });
//     }
// };

// const getTaskComments = async (req, res) => {
//     try {
//         const { taskId } = req.params;
//         const comments = await taskService.fetchCommentsByTaskId(taskId);
//         res.status(200).json(comments);
//     } catch (error) {
//         console.error("Error in getTaskComments Controller:", error);
//         res.status(500).json({ message: error.message });
//     }
// };


// const createSubtask = async (req, res) => {
//     try {
//         const { taskId } = req.params;
//         const { title, assigned_to } = req.body; // assigned_to mein user ID aayegi

//         if (!title || !title.trim()) {
//             return res.status(400).json({ message: "Subtask title is required" });
//         }

//         const newSubtask = await taskService.addSubtask(taskId, title, assigned_to);
//         res.status(201).json(newSubtask);
//     } catch (error) {
//         console.error("Error in createSubtask Controller:", error);
//         res.status(500).json({ message: error.message });
//     }
// };

// const toggleSubtaskStatus = async (req, res) => {
//     try {
//         const { subtaskId } = req.params;
//         const updatedSubtask = await taskService.toggleSubtask(subtaskId);
        
//         if (!updatedSubtask) {
//             return res.status(404).json({ message: "Subtask not found" });
//         }
//         res.status(200).json(updatedSubtask);
//     } catch (error) {
//         console.error("Error in toggleSubtaskStatus Controller:", error);
//         res.status(500).json({ message: error.message });
//     }
// };

// const getTaskSubtasks = async (req, res) => {
//     try {
//         const { taskId } = req.params;
        
//         const subtasks = await taskService.fetchSubtasksByTaskId(taskId);
        
//         res.status(200).json(subtasks);
//     } catch (error) {
//         console.error("Error in getTaskSubtasks Controller:", error);
//         res.status(500).json({ message: error.message });
//     }
// };


// const getTaskAssignees = async (req, res) => {
//     try {
//         const { taskId } = req.params;
//         const assignees = await taskService.fetchAssigneesByTaskId(taskId);
//         res.status(200).json(assignees);
//     } catch (error) {
//         console.error("Error in getTaskAssignees Controller:", error);
//         res.status(500).json({ message: error.message });
//     }
// };

// const toggleTaskAssignee = async (req, res) => {
//     try {
//         const { taskId } = req.params;
//         const { user_id } = req.body; // Kis user ko assign/unassign karna hai

//         if (!user_id) {
//             return res.status(400).json({ message: "User ID is required" });
//         }

//         const result = await taskService.toggleAssigneeMapping(taskId, user_id);
//         res.status(200).json(result); // result returns { action: 'assigned'/'unassigned' }
//     } catch (error) {
//         console.error("Error in toggleTaskAssignee Controller:", error);
//         res.status(500).json({ message: error.message });
//     }
// };


// const getProjectEpics = async (req, res) => {
//     try {
//         const { projectId } = req.params;
//         const epics = await taskService.fetchEpicsByProjectId(projectId);
//         res.status(200).json(epics);
//     } catch (error) {
//         console.error("Error in getProjectEpics:", error);
//         res.status(500).json({ message: error.message });
//     }
// };

// const updateTaskEpic = async (req, res) => {
//     try {
//         const { taskId } = req.params;
//         const { epic_id } = req.body; // Pass null if removing epic

//         const updatedTask = await taskService.assignEpicToTask(taskId, epic_id);
//         res.status(200).json(updatedTask);
//     } catch (error) {
//         console.error("Error in updateTaskEpic:", error);
//         res.status(500).json({ message: error.message });
//     }
// };

// module.exports = {
//     getBoardData,
//     updateTaskStatus,
//     createTask,
//     updateTaskFields,
//     addTaskComment,
//     getTaskComments,
//     toggleSubtaskStatus,
//     createSubtask,
//     getTaskSubtasks,
//     getTaskAssignees,
//     toggleTaskAssignee,
//     getProjectEpics,
//     updateTaskEpic,
//     getAssignedBoardData,
//     getTodayTaskData
// };

























// const taskService = require('../services/task.service');

// const getBoardData = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const boardData = await taskService.fetchBoardData(id);
//         res.json(boardData);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

// const getAssignedBoardData = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const user_id = req.user.id;
//         const boardData = await taskService.fetchAssignedBoardData(id, user_id);
//         res.json(boardData);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

// const getTodayTaskData = async (req, res) => {
//     try {
//         const user_id = req.user.id;
//         const boardData = await taskService.fetchTodayTaskData(user_id);
//         res.json({ success: true, data: boardData });
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

// // 🔄 REAL-TIME UPGRADE: Task Status Change (Drag & Drop)
// const updateTaskStatus = async (req, res) => {
//     try {
//         const { taskId } = req.params;
//         const { status, position, project_id } = req.body; // 👈 Frontend payload se project_id lein
        
//         await taskService.updateTaskState(taskId, status, position);
        
//         // 🚀 BROADCAST: Baki sab developers ka board updates sync karein
//         if (global.io && project_id) {
//             global.io.to(`project_room:${project_id}`).emit("board:task_moved_received", {
//                 task_id: taskId,
//                 source_data: { status, position },
//                 project_id
//             });
//         }
        
//         res.json({ success: true });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// };

// // 🔄 REAL-TIME UPGRADE: Quick Create Task
// const createTask = async (req, res) => {
//     try {
//         const newTask = await taskService.createNewTask(req.body);
        
//         // 🚀 BROADCAST: Naya task real-time mein board par inject karein
//         if (global.io && req.body.project_id) {
//             global.io.to(`project_room:${req.body.project_id}`).emit("board:task_created_received", {
//                 project_id: req.body.project_id,
//                 task: newTask
//             });
//         }

//         res.status(201).json(newTask);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

// // 🔄 REAL-TIME UPGRADE: Task Modal Fields Update (Title, Description, etc.)
// const updateTaskFields = async (req, res) => {
//     try {
//         const { taskId } = req.params;
//         const updatedData = req.body; // updatedData mein project_id lazmi hona chahiye

//         const updatedTask = await taskService.updateTaskInDB(taskId, updatedData);
        
//         if (!updatedTask) {
//             return res.status(404).json({ message: "Task not found" });
//         }

//         // 🚀 BROADCAST: Jab title ya description badle to real-time update ho
//         if (global.io && updatedData.project_id) {
//             global.io.to(`project_room:${updatedData.project_id}`).emit("board:task_updated_received", {
//                 project_id: updatedData.project_id,
//                 task_id: taskId,
//                 updatedFields: updatedData
//             });
//         }

//         res.status(200).json(updatedTask);
//     } catch (error) {
//         console.error("Error in updateTaskFields Controller:", error);
//         res.status(500).json({ message: error.message });
//     }
// };

// // 🔄 REAL-TIME UPGRADE: Task Comments Section
// const addTaskComment = async (req, res) => {
//     try {
//         const { taskId } = req.params;
//         const { comment_text, project_id } = req.body; // 👈 Frontend se project_id bhi pass karein
//         const userId = req.user.id; 

//         if (!comment_text || !comment_text.trim()) {
//             return res.status(400).json({ message: "Comment text is required" });
//         }

//         const newComment = await taskService.createComment(taskId, userId, comment_text);

//         // 🚀 BROADCAST: Agar koi comment open karke baitha hai, to bina refresh naya comment popup ho
//         if (global.io && project_id) {
//             global.io.to(`project_room:${project_id}`).emit("task:comment_received", {
//                 task_id: taskId,
//                 comment: newComment
//             });
//         }

//         res.status(201).json(newComment);
//     } catch (error) {
//         console.error("Error in addTaskComment Controller:", error);
//         res.status(500).json({ message: error.message });
//     }
// };

// const getTaskComments = async (req, res) => {
//     try {
//         const { taskId } = req.params;
//         const comments = await taskService.fetchCommentsByTaskId(taskId);
//         res.status(200).json(comments);
//     } catch (error) {
//         console.error("Error in getTaskComments Controller:", error);
//         res.status(500).json({ message: error.message });
//     }
// };

// const createSubtask = async (req, res) => {
//     try {
//         const { taskId } = req.params;
//         const { title, assigned_to } = req.body;

//         if (!title || !title.trim()) {
//             return res.status(400).json({ message: "Subtask title is required" });
//         }

//         const newSubtask = await taskService.addSubtask(taskId, title, assigned_to);
//         res.status(201).json(newSubtask);
//     } catch (error) {
//         console.error("Error in createSubtask Controller:", error);
//         res.status(500).json({ message: error.message });
//     }
// };

// const toggleSubtaskStatus = async (req, res) => {
//     try {
//         const { subtaskId } = req.params;
//         const updatedSubtask = await taskService.toggleSubtask(subtaskId);
        
//         if (!updatedSubtask) {
//             return res.status(404).json({ message: "Subtask not found" });
//         }
//         res.status(200).json(updatedSubtask);
//     } catch (error) {
//         console.error("Error in toggleSubtaskStatus Controller:", error);
//         res.status(500).json({ message: error.message });
//     }
// };

// const getTaskSubtasks = async (req, res) => {
//     try {
//         const { taskId } = req.params;
//         const subtasks = await taskService.fetchSubtasksByTaskId(taskId);
//         res.status(200).json(subtasks);
//     } catch (error) {
//         console.error("Error in getTaskSubtasks Controller:", error);
//         res.status(500).json({ message: error.message });
//     }
// };

// const getTaskAssignees = async (req, res) => {
//     try {
//         const { taskId } = req.params;
//         const assignees = await taskService.fetchAssigneesByTaskId(taskId);
//         res.status(200).json(assignees);
//     } catch (error) {
//         console.error("Error in getTaskAssignees Controller:", error);
//         res.status(500).json({ message: error.message });
//     }
// };

// const toggleTaskAssignee = async (req, res) => {
//     try {
//         const { taskId } = req.params;
//         const { user_id } = req.body;

//         if (!user_id) {
//             return res.status(400).json({ message: "User ID is required" });
//         }

//         const result = await taskService.toggleAssigneeMapping(taskId, user_id);
//         res.status(200).json(result); 
//     } catch (error) {
//         console.error("Error in toggleTaskAssignee Controller:", error);
//         res.status(500).json({ message: error.message });
//     }
// };

// const getProjectEpics = async (req, res) => {
//     try {
//         const { projectId } = req.params;
//         const epics = await taskService.fetchEpicsByProjectId(projectId);
//         res.status(200).json(epics);
//     } catch (error) {
//         console.error("Error in getProjectEpics:", error);
//         res.status(500).json({ message: error.message });
//     }
// };

// // 🔄 REAL-TIME UPGRADE: Epic Link / Remove Epic
// const updateTaskEpic = async (req, res) => {
//     try {
//         const { taskId } = req.params;
//         const { epic_id, project_id } = req.body; // 👈 Frontend se project_id pass karein

//         const updatedTask = await taskService.assignEpicToTask(taskId, epic_id);
        
//         // 🚀 BROADCAST: Board par Epic badge live render ya remove karein
//         if (global.io && project_id) {
//             global.io.to(`project_room:${project_id}`).emit("board:task_updated_received", {
//                 project_id,
//                 task_id: taskId
//             });
//         }

//         res.status(200).json(updatedTask);
//     } catch (error) {
//         console.error("Error in updateTaskEpic:", error);
//         res.status(500).json({ message: error.message });
//     }
// };

// module.exports = {
//     getBoardData,
//     updateTaskStatus,
//     createTask,
//     updateTaskFields,
//     addTaskComment,
//     getTaskComments,
//     toggleSubtaskStatus,
//     createSubtask,
//     getTaskSubtasks,
//     getTaskAssignees,
//     toggleTaskAssignee,
//     getProjectEpics,
//     updateTaskEpic,
//     getAssignedBoardData,
//     getTodayTaskData
// };





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
        const user_id = req.user.id;
        const boardData = await taskService.fetchAssignedBoardData(id, user_id);
        res.json(boardData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getTodayTaskData = async (req, res) => {
    try {
        const user_id = req.user.id;
        const boardData = await taskService.fetchTodayTaskData(user_id);
        res.json({ success: true, data: boardData });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 🔄 REAL-TIME UPGRADE: Task Status Change (Drag & Drop)
// const updateTaskStatus = async (req, res) => {
//     try {
//         const { taskId } = req.params;
//         const { status, position, project_id } = req.body; 
        
//         await taskService.updateTaskState(taskId, status, position);
        
//         // 🚀 BROADCAST: Broadcast layout to all developers inside the specific room
//         if (global.io && project_id) {
//             global.io.to(`project_room:${project_id}`).emit("board:task_moved_received", {
//                 task_id: taskId,
//                 source_data: { status, position },
//                 project_id
//             });
//         }
        
//         res.json({ success: true });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// };



// 🔄 REAL-TIME UPGRADE: Task Status Change (Drag & Drop)
const updateTaskStatus = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { status, position, project_id } = req.body; 

        console.log("####################################################################################################################################################################################",req.user)

        // Safe extraction wrapper fallback
        let targetProjectId = project_id;

        // Validation fallback check
        if (!targetProjectId) {
            const taskRecord = await taskService.updateTaskInDB(taskId, {});
            if (taskRecord) targetProjectId = taskRecord.project_id;
        }
        
        await taskService.updateTaskState(taskId, status, position, targetProjectId);
        
        // 🚀 BROADCAST GLOBAL EVENT: Ab room string proper valid pass hogi hamesha
        if (global.io && targetProjectId) {
            console.log(`📡 Broadcasting task move to project room: project_room:${targetProjectId}`);
            global.io.to(`project_room:${targetProjectId}`).emit("board:task_moved_received", {
                task_id: taskId,
                status,
                position,
                project_id: targetProjectId,
                updated_by: req.user.full_name || req.user.id // Optional: Kaunse user ne move kiya, frontend mein show karne ke liye
            });
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error("Error in updateTaskStatus controller:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 🔄 REAL-TIME UPGRADE: Quick Create Task
const createTask = async (req, res) => {
    try {
        const newTask = await taskService.createNewTask(req.body);
        
        // 🚀 BROADCAST: Safe inject payload directly
        if (global.io && req.body.project_id) {
            global.io.to(`project_room:${req.body.project_id}`).emit("board:task_created_received", {
                project_id: req.body.project_id,
                task: newTask
            });
        }

        res.status(201).json(newTask);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 🔄 REAL-TIME UPGRADE: Task Modal Fields Update (Title, Description, etc.)
const updateTaskFields = async (req, res) => {
    try {
        const { taskId } = req.params;
        const updatedData = req.body; 

        const updatedTask = await taskService.updateTaskInDB(taskId, updatedData);
        
        if (!updatedTask) {
            return res.status(404).json({ message: "Task not found" });
        }

        // 🚀 FIX: Agar manager dynamic modal se change kare, project_id humesha database record se handle ho sake
        const targetProjectId = updatedData.project_id || updatedTask.project_id;

        if (global.io && targetProjectId) {
            global.io.to(`project_room:${targetProjectId}`).emit("board:task_updated_received", {
                project_id: targetProjectId,
                task_id: taskId,
                updatedFields: updatedData
            });
        }

        res.status(200).json(updatedTask);
    } catch (error) {
        console.error("Error in updateTaskFields Controller:", error);
        res.status(500).json({ message: error.message });
    }
};

// 🔄 REAL-TIME UPGRADE: Task Comments Section
const addTaskComment = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { comment_text, project_id } = req.body; 
        const userId = req.user.id; 

        if (!comment_text || !comment_text.trim()) {
            return res.status(400).json({ message: "Comment text is required" });
        }

        const newComment = await taskService.createComment(taskId, userId, comment_text);

        if (global.io && project_id) {
            global.io.to(`project_room:${project_id}`).emit("task:comment_received", {
                task_id: taskId,
                comment: newComment
            });
        }

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

// 🔄 REAL-TIME UPGRADE: Subtask Addition Matrix Broadcast
const createSubtask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { title, assigned_to, project_id } = req.body; // 👈 Frontend se project_id pass karein ya safe fallback dein

        if (!title || !title.trim()) {
            return res.status(400).json({ message: "Subtask title is required" });
        }

        const newSubtask = await taskService.addSubtask(taskId, title, assigned_to);

        // 🚀 BROADCAST: Trigger board layout queries update instantly on subtask additions
        if (global.io && project_id) {
            global.io.to(`project_room:${project_id}`).emit("board:task_updated_received", { project_id });
        }

        res.status(201).json(newSubtask);
    } catch (error) {
        console.error("Error in createSubtask Controller:", error);
        res.status(500).json({ message: error.message });
    }
};

// 🔄 REAL-TIME UPGRADE: Subtask Checkbox Toggling Real-time sync
const toggleSubtaskStatus = async (req, res) => {
    try {
        const { subtaskId } = req.params;
        const { project_id } = req.body; // 👈 Checkbox hit hote hi dynamic project_id body se extract karein
        
        const updatedSubtask = await taskService.toggleSubtask(subtaskId);
        
        if (!updatedSubtask) {
            return res.status(404).json({ message: "Subtask not found" });
        }

        // 🚀 BROADCAST: Update the task completion numbers layout fraction (e.g., 2/4 to 3/4) live!
        if (global.io && project_id) {
            global.io.to(`project_room:${project_id}`).emit("board:task_updated_received", { project_id });
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

// 🔄 REAL-TIME UPGRADE: Assignee Toggle Sync
const toggleTaskAssignee = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { user_id, project_id } = req.body; // 👈 User assign/unassign event payload check with project key

        if (!user_id) {
            return res.status(400).json({ message: "User ID is required" });
        }

        const result = await taskService.toggleAssigneeMapping(taskId, user_id);

        // 🚀 BROADCAST: Jab manager kissi dev ko task se remove ya add kare, board instant sync ho
        if (global.io && project_id) {
            global.io.to(`project_room:${project_id}`).emit("board:task_updated_received", { project_id });
        }

        res.status(200).json(result); 
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

// 🔄 REAL-TIME UPGRADE: Epic Link / Remove Epic
const updateTaskEpic = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { epic_id, project_id } = req.body; 

        const updatedTask = await taskService.assignEpicToTask(taskId, epic_id);
        
        if (global.io && project_id) {
            global.io.to(`project_room:${project_id}`).emit("board:task_updated_received", {
                project_id,
                task_id: taskId
            });
        }

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