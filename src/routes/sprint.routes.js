const express = require("express");
const router = express.Router();
const sprintController = require("../controllers/sprint.controller");
// const { protect } = require("../middleware/authMiddleware"); // Agar auth systems required hain

router.post("/", sprintController.createSprint);
router.get("/project/:projectId", sprintController.getProjectSprints);
router.patch("/:sprintId/start", sprintController.startSprint);

module.exports = router;