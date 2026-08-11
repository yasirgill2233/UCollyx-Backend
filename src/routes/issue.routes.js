const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const issueController = require('../controllers/issue.controller');
const { protect } = require('../middleware/auth.middleware');

router.post("/create", protect, upload.array("issues", 5), issueController.create);
router.get("/project/:projectId", protect, issueController.getByProject);
router.get("/", protect, issueController.getIssues);

router.get("/assigned-to-me", protect, issueController.getDetails);
router.patch("/:id/status", protect, issueController.updateStatus);

router.post("/:id/comments", protect, issueController.postComment);

router.post("/:id/attachments", protect, issueController.uploadAttachment);

router.get("/qa-ready", protect, issueController.getIssuesList);

router.patch("/:id/verify", protect,  issueController.verifyIssueVerdict);

module.exports = router;