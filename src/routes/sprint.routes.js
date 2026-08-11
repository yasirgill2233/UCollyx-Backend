const express = require("express");
const router = express.Router();
const sprintController = require("../controllers/sprint.controller");
const { protect } = require("../middleware/auth.middleware");

router.post("/", sprintController.createSprint);
router.get("/project/:projectId",protect, sprintController.getProjectSprints);
router.patch("/:sprintId/start", sprintController.startSprint);

module.exports = router;