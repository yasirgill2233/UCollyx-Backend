const { Op } = require("sequelize");
const { Issue, IssueAttachment, User, IssueComment } = require("../models");

const issueService = {
  //   createIssue: async (issueData) => {
  //     try {

  //       const { metadata, steps_to_repro } = issueData;

  //       let formattedSteps = "";
  //       if (Array.isArray(steps_to_repro)) {
  //         formattedSteps = steps_to_repro.filter(step => step && step.trim() !== "").join("\n");
  //       } else {
  //         formattedSteps = steps_to_repro || "";
  //       }

  //       let finalDescription = issueData.description || "Logged via QA Portal";
  //       if (metadata) {
  //         try {
  //           const parsedMeta = typeof metadata === "string" ? JSON.parse(metadata) : metadata;
  //           if (parsedMeta && parsedMeta.is_red_card) {
  //             finalDescription = `[RED CARD ESCALATION] Reason: ${parsedMeta.red_card_reason}\n\n${finalDescription}`;
  //           }
  //         } catch (e) {
  //           console.log("Metadata parsing fallback logs checked");
  //         }
  //       }

  //       const cleanedData = {
  //         project_id: issueData.project_id ? parseInt(issueData.project_id) : null,
  //         raised_by: issueData.raised_by ? parseInt(issueData.raised_by) : 1,
  //         assigned_to: issueData.assigned_to ? parseInt(issueData.assigned_to) : 1,
  //         title: issueData.title || "Untitled Bug Report",
  //         description: finalDescription,
  //         severity: issueData.severity || "Medium",
  //         status: "New",
  //         retest_status: "Pending",
  //         steps_to_repro: formattedSteps,
  //         expected_result: issueData.expected_result || "",
  //         actual_result: issueData.actual_result || "",
  //         environment: issueData.environment || "Production"
  //       };

  //       return await Issue.create(cleanedData);

  //     } catch (error) {
  //       console.error(error);
  //       throw error;
  //     }
  //   },

  createIssue: async (issueData) => {
    try {
      const { metadata, steps_to_repro, uploaded_files } = issueData;
      let formattedSteps = "";
      if (Array.isArray(steps_to_repro)) {
        formattedSteps = steps_to_repro
          .filter((step) => step && step.trim() !== "")
          .join("\n");
      } else {
        formattedSteps = steps_to_repro || "";
      }

      let finalDescription = issueData.description || "Logged via QA Portal";
      if (metadata) {
        try {
          const parsedMeta =
            typeof metadata === "string" ? JSON.parse(metadata) : metadata;
          if (parsedMeta && parsedMeta.is_red_card) {
            finalDescription = `[RED CARD ESCALATION] Reason: ${parsedMeta.red_card_reason}\n\n${finalDescription}`;
          }
        } catch (e) {}
      }

      const newIssue = await Issue.create({
        project_id: issueData.project_id,
        raised_by: issueData.raised_by,
        assigned_to: issueData.assigned_to || null,
        title: issueData.title,
        description: finalDescription,
        severity: issueData.severity || "Medium",
        status: "New",
        retest_status: "Pending",
        steps_to_repro: formattedSteps,
        expected_result: issueData.expected_result || "",
        actual_result: issueData.actual_result || "",
        environment: issueData.environment || "Production",
      });

      if (
        uploaded_files &&
        Array.isArray(uploaded_files) &&
        uploaded_files.length > 0
      ) {
        const attachmentRecords = uploaded_files.map((file) => ({
          issue_id: newIssue.id,
          file_name: file.name,
          file_url: file.url,
        }));

        await IssueAttachment.bulkCreate(attachmentRecords);
      }

      return newIssue;
    } catch (error) {
      console.error("=== CRITICAL SERVICE LAYER SQL EXCEPTION ===");
      console.error(error);
      throw error;
    }
  },

  getProjectIssues: async (projectId) => {
    return await Issue.findAll({
      where: { project_id: projectId },
      include: [
        {
          model: User,
          as: "reporter",
          attributes: ["id", "full_name", "avatar_url"],
        },
        {
          model: User,
          as: "assignee",
          attributes: ["id", "full_name", "avatar_url"],
        },
        { model: IssueAttachment, as: "attachments" },
      ],
      order: [["created_at", "DESC"]],
    });
  },

  // 3. Single Issue ki details, comments aur attachments ke sath nikalna
  getIssues: async (userId) => {
    return await Issue.findAll({
      include: [
        {
          model: User,
          as: "reporter",
          attributes: ["id", "full_name", "avatar_url"],
        },
        {
          model: User,
          as: "assignee",
          attributes: ["id", "full_name", "avatar_url"],
        },
        { model: IssueAttachment, as: "attachments" },
        {
          model: IssueComment,
          as: "comments",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "full_name", "avatar_url"],
            },
          ],
        },
      ],
      order: [[{ model: IssueComment, as: "comments" }, "created_at", "ASC"]],
    });
  },

  getIssueDetails: async (userId) => {
    return await Issue.findAll({
      where: {
        assigned_to: userId,
        status: {
          [Op.ne]: "Resolved",
        },
      },
      include: [
        {
          model: User,
          as: "reporter",
          attributes: ["id", "full_name", "avatar_url"],
        },
        {
          model: User,
          as: "assignee",
          attributes: ["id", "full_name", "avatar_url"],
        },
        { model: IssueAttachment, as: "attachments" },
        {
          model: IssueComment,
          as: "comments",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "full_name", "avatar_url"],
            },
          ],
        },
      ],
      order: [[{ model: IssueComment, as: "comments" }, "created_at", "ASC"]],
    });
  },

  updateIssueStatus: async (issueId, updateFields) => {
    const issue = await Issue.findByPk(issueId);

    if (!issue) throw new Error("Issue not found");

    if (
      updateFields.status === "Acknowledged" ||
      updateFields.status === "In Progress" ||
      updateFields.status === "Ready for QA"
    ) {
      updateFields.retest_status = "Pending";
      console.log("-> Retest status automatically shifted to Pending");
    }

    Object.assign(issue, updateFields);
    await issue.save();
    return issue;
  },

  // 5. Issue par comment add karna
  addComment: async (issueId, userId, commentText) => {
    const comment = await IssueComment.create({
      issue_id: issueId,
      user_id: userId,
      comment_text: commentText,
    });

    // Naya comment fetch karke return karein taake User profile details sath milein
    return await IssueComment.findByPk(comment.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "full_name", "avatar_url"],
        },
      ],
    });
  },

  // 6. Issue Attachment file save karna
  addAttachment: async (issueId, fileName, fileUrl) => {
    return await IssueAttachment.create({
      issue_id: issueId,
      file_name: fileName,
      file_url: fileUrl,
    });
  },
};

module.exports = issueService;
