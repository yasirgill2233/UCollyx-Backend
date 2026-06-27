// const { Issue, Project, User } = require("../models");
// const issueService = require("../services/issue.service");
// const { Op } = require("sequelize");

// const issueController = {

//   create: async (req, res) => {
//     try {
//       const raised_by = req.user.id;

//       // 🔍 Multer files parsing array context
//       let uploadedFiles = [];
//       if (req.files && req.files.length > 0) {
//         uploadedFiles = req.files.map((file) => ({
//           name: file.originalname,
//           // static url database reference map configuration
//           url: `/uploads/issues/${file.filename}`,
//         }));
//       }

//       // 🔍 FormData parsing backup handler:
//       // text elements json fields parsing safeguards (jaise steps_to_repro array ko text format dena)
//       let parsedSteps = req.body.steps_to_repro;
//       try {
//         if (typeof parsedSteps === "string") {
//           parsedSteps = JSON.parse(parsedSteps);
//         }
//       } catch (e) {
//         parsedSteps = req.body.steps_to_repro;
//       }

//       const issuePayload = {
//         ...req.body,
//         steps_to_repro: parsedSteps,
//         raised_by,
//         uploaded_files: uploadedFiles, // Database bulkCreate ke liye formatting structures target arrays
//       };

//       const newIssue = await issueService.createIssue(issuePayload);

//       return res.status(201).json({ success: true, data: newIssue });
//     } catch (error) {
//       console.error("Controller Execution Crash Log:", error);
//       return res.status(500).json({ success: false, message: error.message });
//     }
//   },

//   getByProject: async (req, res) => {
//     try {
//       const { projectId } = req.params;
//       const workspaceId = req.user.workspace_id;
//       const issues = await issueService.getProjectIssues(projectId, workspaceId);
//       return res.status(200).json({ success: true, data: issues });
//     } catch (error) {
//       return res.status(500).json({ success: false, message: error.message });
//     }
//   },

//   getIssues: async (req, res) => {
//     const workspaceId = req.user.workspace_id;
//     try {
//       const issue = await issueService.getIssues(workspaceId);
//       if (!issue)
//         return res
//           .status(404)
//           .json({ success: false, message: "Issue not found" });
//       return res.status(200).json({ success: true, data: issue });
//     } catch (error) {
//       return res.status(500).json({ success: false, message: error.message });
//     }
//   },

//   getDetails: async (req, res) => {
//     try {
//       const id = req.user.id;
//       const workspaceId = req.user.workspace_id;
//       const issue = await issueService.getIssueDetails(id, workspaceId);
//       if (!issue)
//         return res
//           .status(404)
//           .json({ success: false, message: "Issue not found" });
//       return res.status(200).json({ success: true, data: issue });
//     } catch (error) {
//       return res.status(500).json({ success: false, message: error.message });
//     }
//   },

//   updateStatus: async (req, res) => {
//     try {
//       const { id } = req.params;
//       // Body mein status, retest_status ya assigned_to pass ho sakta hai
//       const updatedIssue = await issueService.updateIssueStatus(id, req.body);
//       return res.status(200).json({ success: true, data: updatedIssue });
//     } catch (error) {
//       return res.status(500).json({ success: false, message: error.message });
//     }
//   },

//   postComment: async (req, res) => {
//     try {
//       const { id } = req.params;
//       const userId = req.user.id;
//       const { comment_text } = req.body;

//       if (!comment_text?.trim()) {
//         return res
//           .status(400)
//           .json({ success: false, message: "Comment content cannot be empty" });
//       }

//       const comment = await issueService.addComment(id, userId, comment_text);
//       return res.status(201).json({ success: true, data: comment });
//     } catch (error) {
//       return res.status(500).json({ success: false, message: error.message });
//     }
//   },

//   uploadAttachment: async (req, res) => {
//     try {
//       const { id } = req.params;
//       const { file_name, file_url } = req.body;

//       const attachment = await issueService.addAttachment(
//         id,
//         file_name,
//         file_url,
//       );
//       return res.status(201).json({ success: true, data: attachment });
//     } catch (error) {
//       return res.status(500).json({ success: false, message: error.message });
//     }
//   },

//   // getIssuesList: async (req, res) => {
//   //   try {
//   //     const { status } = req.query;
//   //     console.log("Database Pipeline Tracking Status Param:", status);

//   //     let whereCondition = {};
//   //     if (status) {
//   //       whereCondition.status = status;
//   //     }

//   //     const issues = await Issue.findAll({
//   //       where: {
//   //         [Op.or]: [
//   //           { status: "Ready for QA" },
//   //           // {
//   //           //   retest_status: {
//   //           //     [Op.in]: ["Failed"]
//   //           //   }
//   //           // }
//   //         ],
//   //       },
//   //       include: [
//   //         {
//   //           model: Project,
//   //           as: "project",
//   //           attributes: ["id", "name"], // Interface filter labels loading
//   //         },
//   //         {
//   //           model: User,
//   //           as: "assignee",
//   //           attributes: ["id", "full_name"], // Assignee identification context
//   //         },
//   //       ],
//   //       order: [["updatedAt", "DESC"]], // Fresh items to test top par show honge
//   //     });

//   //     return res.status(200).json({
//   //       success: true,
//   //       data: issues,
//   //     });
//   //   } catch (error) {
//   //     console.error("Error in getIssuesList Controller:", error);
//   //     return res.status(500).json({
//   //       success: false,
//   //       message:
//   //         "Internal Server Error executing active workspace queues query.",
//   //     });
//   //   }
//   // },

//    getIssuesList: async (req, res) => {
//     const workspaceId = req?.user?.workspace_id;
//     try {
//       const { status } = req.query;
//       console.log("Database Pipeline Tracking Status Param:", status);

//       let whereCondition = {};
//       if (status) {
//         whereCondition.status = status;
//       }

//       const issues = await Issue.findAll({
//         where: {
//           [Op.or]: [
//             { status: "Ready for QA" },
//             // {
//             //   retest_status: {
//             //     [Op.in]: ["Failed"]
//             //   }
//             // }
//           ],
//         },
//         include: [
//           {
//             model: Project,
//             as: "project",
//             where: {
//             workspace_id: workspaceId, // 🔥 Secure workspace isolation check
//           },
//             attributes: ["id", "name"], // Interface filter labels loading
//           },
//           {
//             model: User,
//             as: "assignee",
//             attributes: ["id", "full_name"], // Assignee identification context
//           },
//         ],
//         order: [["updatedAt", "DESC"]], // Fresh items to test top par show honge
//       });

//       return res.status(200).json({
//         success: true,
//         data: issues,
//       });
//     } catch (error) {
//       console.error("Error in getIssuesList Controller:", error);
//       return res.status(500).json({
//         success: false,
//         message:
//           "Internal Server Error executing active workspace queues query.",
//       });
//     }
//   },

//   verifyIssueVerdict: async (req, res) => {
//     try {
//       const { id } = req.params;
//       const { status, comment } = req.body;

//       console.log(`Processing QA Verdict for Item #${id}:`, {
//         status,
//         comment,
//       });

//       const issue = await Issue.findByPk(id);
//       if (!issue) {
//         return res.status(404).json({
//           success: false,
//           message: "Target issue tracking registry entry not found.",
//         });
//       }

//       console.log("Hello There I am using whatsapp:", issue);

//       let updatedStatus = "";
//       let updatedRetestStatus = "";
//       if (status === "Passed") {
//         updatedStatus = "Resolved";
//         updatedRetestStatus = "Passed";
//       } else if (status === "Failed") {
//         updatedStatus = "In Progress";
//         updatedRetestStatus = "Failed";
//       }

//       await issue.update({
//         status: updatedStatus,
//         retest_status: updatedRetestStatus,
//         qa_notes: comment || issue.qa_notes,
//       });

//       return res.status(200).json({
//         success: true,
//         message: `Issue status updated successfully to ${updatedStatus} pipeline stage.`,
//         data: issue,
//       });
//     } catch (error) {
//       console.error("Error in verifyIssueVerdict Controller:", error);
//       return res.status(500).json({
//         success: false,
//         message: "Failed to persist operational QA verdict updates metadata.",
//       });
//     }
//   },
// };

// module.exports = issueController;


















const { Issue, Project, User } = require("../models");
const issueService = require("../services/issue.service");
const { Op } = require("sequelize");

const issueController = {

  create: async (req, res) => {
    try {
      const raised_by = req.user.id;

      // 🔍 Multer files parsing array context
      let uploadedFiles = [];
      if (req.files && req.files.length > 0) {
        uploadedFiles = req.files.map((file) => ({
          name: file.originalname,
          url: `/uploads/issues/${file.filename}`,
        }));
      }

      // 🔍 FormData parsing backup handler:
      let parsedSteps = req.body.steps_to_repro;
      try {
        if (typeof parsedSteps === "string") {
          parsedSteps = JSON.parse(parsedSteps);
        }
      } catch (e) {
        parsedSteps = req.body.steps_to_repro;
      }

      const issuePayload = {
        ...req.body,
        steps_to_repro: parsedSteps,
        raised_by,
        uploaded_files: uploadedFiles,
      };

      const newIssue = await issueService.createIssue(issuePayload);

      // =========================================================
      // 📡 REAL-TIME DISPATCH: QA BUG DETECTED TO DEVELOPER
      // =========================================================
      if (global.io && newIssue && newIssue.assigned_to) {
        try {
          // Project name nikalne ke liye query karein
          const targetProj = await Project.findByPk(newIssue.project_id, { attributes: ["name"] });
          const targetUserRoom = `user_room:${String(newIssue.assigned_to)}`;

          global.io.to(targetUserRoom).emit("qa:bug_detected", {
            issueId: newIssue.id,
            title: newIssue.title,
            projectName: targetProj ? targetProj.name : "Workspace Context",
            severity: newIssue.severity || "High",
            message: `New bug spotted: "${newIssue.title}" has been assigned to you.`
          });
          console.log(`📡 [QA Alert Dispatch] Dispatched bug event to target room: ${targetUserRoom}`);
        } catch (socketErr) {
          console.error("⚠️ Socket Notification dispatch failed:", socketErr.message);
        }
      }

      return res.status(201).json({ success: true, data: newIssue });
    } catch (error) {
      console.error("Controller Execution Crash Log:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  getByProject: async (req, res) => {
    try {
      const { projectId } = req.params;
      const workspaceId = req.user.workspace_id;
      const issues = await issueService.getProjectIssues(projectId, workspaceId);

      console.log("################################@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@::::::::::::::::",issues)
      return res.status(200).json({ success: true, data: issues });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  getIssues: async (req, res) => {
    const workspaceId = req.user.workspace_id;
    try {
      const issue = await issueService.getIssues(workspaceId);
      if (!issue)
        return res
          .status(404)
          .json({ success: false, message: "Issue not found" });
      return res.status(200).json({ success: true, data: issue });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  getDetails: async (req, res) => {
    try {
      const id = req.user.id;
      const workspaceId = req.user.workspace_id;
      const issue = await issueService.getIssueDetails(id, workspaceId);
      if (!issue)
        return res
          .status(404)
          .json({ success: false, message: "Issue not found" });
      return res.status(200).json({ success: true, data: issue });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // updateStatus: async (req, res) => {
  //   try {
  //     const { id } = req.params;
  //     const updatedIssue = await issueService.updateIssueStatus(id, req.body);

  //     // =========================================================
  //     // 📡 REAL-TIME DISPATCH: BUG STATUS MODIFIED
  //     // =========================================================
  //     if (global.io && updatedIssue && updatedIssue.assigned_to) {
  //       const targetUserRoom = `user_room:${String(updatedIssue.assigned_to)}`;
  //       global.io.to(targetUserRoom).emit("qa:bug_updated", {
  //         issueId: updatedIssue.id,
  //         title: updatedIssue.title,
  //         status: updatedIssue.status,
  //         message: `Issue "${updatedIssue.title}" status has been moved to ${updatedIssue.status}.`
  //       });
  //     }

  //     return res.status(200).json({ success: true, data: updatedIssue });
  //   } catch (error) {
  //     return res.status(500).json({ success: false, message: error.message });
  //   }
  // },

  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      
      // 1. Pehle current issue details nikal lo taake pata chale isay raise kis QA ne kiya tha
      const currentIssue = await Issue.findByPk(id, { attributes: ["raised_by", "title", "project_id"] });
      
      // 2. Status update karo
      const updatedIssue = await issueService.updateIssueStatus(id, req.body);

      // =========================================================
      // 📡 REAL-TIME DISPATCH: STATUS CHANGED (ALERT TO QA)
      // =========================================================
      if (global.io && currentIssue && currentIssue.raised_by) {
        try {
          const targetQARoom = `user_room:${String(currentIssue.raised_by)}`;
          const project = await Project.findByPk(currentIssue.project_id, { attributes: ["name"] });
          const developerUser = await User.findByPk(req.user.id, { attributes: ["full_name"] });

          global.io.to(targetQARoom).emit("developer:status_updated", {
            issueId: id,
            title: currentIssue.title,
            projectName: project ? project.name : "Workspace Context",
            devName: developerUser ? developerUser.full_name : "Developer",
            newStatus: req.body.status || "Updated",
            message: `Developer ${developerUser?.full_name} moved "${currentIssue.title}" to ${req.body.status}.`
          });

          console.log(`📡 [Dev Action Alert] Status change notification sent to QA room: ${targetQARoom}`);
        } catch (socketErr) {
          console.error("⚠️ QA Notification dispatch failed:", socketErr.message);
        }
      }

      return res.status(200).json({ success: true, data: updatedIssue });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // postComment: async (req, res) => {
  //   try {
  //     const { id } = req.params;
  //     const userId = req.user.id;
  //     const { comment_text } = req.body;

  //     if (!comment_text?.trim()) {
  //       return res
  //         .status(400)
  //         .json({ success: false, message: "Comment content cannot be empty" });
  //     }

  //     const comment = await issueService.addComment(id, userId, comment_text);
  //     return res.status(201).json({ success: true, data: comment });
  //   } catch (error) {
  //     return res.status(500).json({ success: false, message: error.message });
  //   }
  // },

  postComment: async (req, res) => {
    try {
      const { id } = req.params; // Issue ID
      const userId = req.user.id; // Jo comment kar raha hai
      const { comment_text } = req.body;

      if (!comment_text?.trim()) {
        return res
          .status(400)
          .json({ success: false, message: "Comment content cannot be empty" });
      }

      // 1. DB mein comment save karo
      const comment = await issueService.addComment(id, userId, comment_text);

      // =========================================================
      // 📡 REAL-TIME DISPATCH: FRESH COMMENT ALERTS
      // =========================================================
      if (global.io) {
        try {
          // Issue detail nikalen taake pata chale QA aur Dev kaun hain
          const issue = await Issue.findByPk(id, { attributes: ["raised_by", "assigned_to", "title"] });
          const sender = await User.findByPk(userId, { attributes: ["full_name"] });

          if (issue) {
            // Target dhoondo: Agar comment Dev ne kiya toh QA ko bhejo, agar QA ne kiya toh Dev ko bhejo
            const targetUserId = String(userId) === String(issue.assigned_to) 
              ? issue.raised_by 
              : issue.assigned_to;

            const targetUserRoom = `user_room:${String(targetUserId)}`;

            global.io.to(targetUserRoom).emit("issue:comment_received", {
              issueId: id,
              issueTitle: issue.title,
              senderName: sender ? sender.full_name : "Team Member",
              commentText: comment_text,
              message: `${sender?.full_name} commented on "${issue.title}"`
            });

            console.log(`📡 [Comment Dispatch] Notification fired to room: ${targetUserRoom}`);
          }
        } catch (socketErr) {
          console.error("⚠️ Comment socket emit failed:", socketErr.message);
        }
      }

      return res.status(201).json({ success: true, data: comment });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },
  
  uploadAttachment: async (req, res) => {
    try {
      const { id } = req.params;
      const { file_name, file_url } = req.body;

      const attachment = await issueService.addAttachment(
        id,
        file_name,
        file_url,
      );
      return res.status(201).json({ success: true, data: attachment });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  getIssuesList: async (req, res) => {
    const workspaceId = req?.user?.workspace_id;
    try {
      const { status } = req.query;
      console.log("Database Pipeline Tracking Status Param:", status);

      let whereCondition = {};
      if (status) {
        whereCondition.status = status;
      }

      const issues = await Issue.findAll({
        where: {
          [Op.or]: [
            { status: "Ready for QA" },
          ],
        },
        include: [
          {
            model: Project,
            as: "project",
            where: {
              workspace_id: workspaceId,
            },
            attributes: ["id", "name"],
          },
          {
            model: User,
            as: "assignee",
            attributes: ["id", "full_name"],
          },
        ],
        order: [["updatedAt", "DESC"]],
      });

      return res.status(200).json({
        success: true,
        data: issues,
      });
    } catch (error) {
      console.error("Error in getIssuesList Controller:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error executing active workspace queues query.",
      });
    }
  },

  verifyIssueVerdict: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, comment } = req.body;

      console.log(`Processing QA Verdict for Item #${id}:`, {
        status,
        comment,
      });

      const issue = await Issue.findByPk(id);
      if (!issue) {
        return res.status(404).json({
          success: false,
          message: "Target issue tracking registry entry not found.",
        });
      }

      let updatedStatus = "";
      let updatedRetestStatus = "";
      if (status === "Passed") {
        updatedStatus = "Resolved";
        updatedRetestStatus = "Passed";
      } else if (status === "Failed") {
        updatedStatus = "In Progress";
        updatedRetestStatus = "Failed";
      }

      await issue.update({
        status: updatedStatus,
        retest_status: updatedRetestStatus,
        qa_notes: comment || issue.qa_notes,
      });

      // =========================================================
      // 📡 REAL-TIME DISPATCH: QA VERDICT SIGNATURE TO DEVELOPER
      // =========================================================
      if (global.io && issue.assigned_to) {
        const targetUserRoom = `user_room:${String(issue.assigned_to)}`;
        global.io.to(targetUserRoom).emit("qa:bug_detected", {
          issueId: issue.id,
          title: issue.title,
          projectName: "Retest System Matrix",
          severity: updatedRetestStatus === "Failed" ? "CRITICAL (FAILED)" : "RESOLVED",
          message: `QA verdict processed for "${issue.title}". Result status moved to: ${updatedStatus}`
        });
        console.log(`📡 [QA Verdict Dispatch] Dispatched to room: ${targetUserRoom}`);
      }

      return res.status(200).json({
        success: true,
        message: `Issue status updated successfully to ${updatedStatus} pipeline stage.`,
        data: issue,
      });
    } catch (error) {
      console.error("Error in verifyIssueVerdict Controller:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to persist operational QA verdict updates metadata.",
      });
    }
  },
};

module.exports = issueController;