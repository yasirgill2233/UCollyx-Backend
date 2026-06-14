const express = require("express");
const router = express.Router();
const { getOrganizations, createOrg, changeStatus, getWorkspaceMembersList } = require("../controllers/organization.controller");

router.get("/", getOrganizations);
router.post("/", createOrg);
router.patch("/:id/status", changeStatus);
router.get('/:workspaceId/members', getWorkspaceMembersList);

module.exports = router;