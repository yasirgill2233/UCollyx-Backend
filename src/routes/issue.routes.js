const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const issueController = require('../controllers/issue.controller');
const { protect } = require('../middleware/auth.middleware');

// 📌 Core Issue Actions
router.post("/create", protect, upload.array("issues", 5), issueController.create);                      // Bug create karna
router.get("/project/:projectId/members", protect, issueController.getByProject); // Project dashboard board list load karna
// router.get("/", protect, issueController.getByProject); 
router.get("/", protect, issueController.getIssues);

router.get("/assigned-to-me", protect, issueController.getDetails);             // Issue detail modal open context data fetch
router.patch("/:id/status", protect, issueController.updateStatus);         // Status / Assignee drag-drop change pipeline

// 📌 Discussion & Files Threads Attachments
router.post("/:id/comments", protect, issueController.postComment);       // Issue discussion comment post karna

router.post("/:id/attachments", protect, issueController.uploadAttachment); // Screenshot attach karna

router.get("/qa-ready", issueController.getIssuesList);

// 🛠️ 2. QA Lab Verification Verdict Action
// Handles: PATCH /api/issues/:id/verify
router.patch("/:id/verify", issueController.verifyIssueVerdict);

module.exports = router;