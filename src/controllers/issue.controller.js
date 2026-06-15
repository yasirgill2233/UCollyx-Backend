const { Issue, Project, User } = require("../models");
const issueService = require("../services/issue.service");
const { Op } = require("sequelize");

const issueController = {
  //   create: async (req, res) => {
  //     try {
  //       const raised_by = req.user.id; // Authentication middleware se current user ID
  //       const newIssue = await issueService.createIssue({ ...req.body, raised_by });
  //       return res.status(201).json({ success: true, data: newIssue });
  //     } catch (error) {
  //       return res.status(500).json({ success: false, message: error.message });
  //     }
  //   },

  create: async (req, res) => {
    try {
      const raised_by = req.user.id;

      // 🔍 Multer files parsing array context
      let uploadedFiles = [];
      if (req.files && req.files.length > 0) {
        uploadedFiles = req.files.map((file) => ({
          name: file.originalname,
          // static url database reference map configuration
          url: `/uploads/issues/${file.filename}`,
        }));
      }

      // 🔍 FormData parsing backup handler:
      // text elements json fields parsing safeguards (jaise steps_to_repro array ko text format dena)
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
        uploaded_files: uploadedFiles, // Database bulkCreate ke liye formatting structures target arrays
      };

      const newIssue = await issueService.createIssue(issuePayload);

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

  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      // Body mein status, retest_status ya assigned_to pass ho sakta hai
      const updatedIssue = await issueService.updateIssueStatus(id, req.body);
      return res.status(200).json({ success: true, data: updatedIssue });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  postComment: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { comment_text } = req.body;

      if (!comment_text?.trim()) {
        return res
          .status(400)
          .json({ success: false, message: "Comment content cannot be empty" });
      }

      const comment = await issueService.addComment(id, userId, comment_text);
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

  // getIssuesList: async (req, res) => {
  //   try {
  //     const { status } = req.query;
  //     console.log("Database Pipeline Tracking Status Param:", status);

  //     let whereCondition = {};
  //     if (status) {
  //       whereCondition.status = status;
  //     }

  //     const issues = await Issue.findAll({
  //       where: {
  //         [Op.or]: [
  //           { status: "Ready for QA" },
  //           // {
  //           //   retest_status: {
  //           //     [Op.in]: ["Failed"]
  //           //   }
  //           // }
  //         ],
  //       },
  //       include: [
  //         {
  //           model: Project,
  //           as: "project",
  //           attributes: ["id", "name"], // Interface filter labels loading
  //         },
  //         {
  //           model: User,
  //           as: "assignee",
  //           attributes: ["id", "full_name"], // Assignee identification context
  //         },
  //       ],
  //       order: [["updatedAt", "DESC"]], // Fresh items to test top par show honge
  //     });

  //     return res.status(200).json({
  //       success: true,
  //       data: issues,
  //     });
  //   } catch (error) {
  //     console.error("Error in getIssuesList Controller:", error);
  //     return res.status(500).json({
  //       success: false,
  //       message:
  //         "Internal Server Error executing active workspace queues query.",
  //     });
  //   }
  // },

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
            // {
            //   retest_status: {
            //     [Op.in]: ["Failed"]
            //   }
            // }
          ],
        },
        include: [
          {
            model: Project,
            as: "project",
            where: {
            workspace_id: workspaceId, // 🔥 Secure workspace isolation check
          },
            attributes: ["id", "name"], // Interface filter labels loading
          },
          {
            model: User,
            as: "assignee",
            attributes: ["id", "full_name"], // Assignee identification context
          },
        ],
        order: [["updatedAt", "DESC"]], // Fresh items to test top par show honge
      });

      return res.status(200).json({
        success: true,
        data: issues,
      });
    } catch (error) {
      console.error("Error in getIssuesList Controller:", error);
      return res.status(500).json({
        success: false,
        message:
          "Internal Server Error executing active workspace queues query.",
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

      console.log("Hello There I am using whatsapp:", issue);

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
