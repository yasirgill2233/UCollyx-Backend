const {Sprint, sequelize, Project} = require("../models");

// @desc    Create a new sprint cycle linked to a project foreign key
// @route   POST /api/sprints
exports.createSprint = async (req, res) => {
  try {
    const { name, start_date, end_date, project_id } = req.body;

    // Basic validation check
    if (!name || !start_date || !end_date || !project_id) {
      return res.status(400).json({ 
        success: false, 
        message: "Please provide all required parameters (name, start_date, end_date, project_id)." 
      });
    }

    const newSprint = await Sprint.create({
      name,
      start_date,
      end_date,
      project_id: Number(project_id),
      status: "planned" // Default state
    });

    return res.status(201).json({
      success: true,
      message: "Sprint timeline initialized successfully",
      data: newSprint
    });
  } catch (error) {
    console.error("Sprint Creation Error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server pipeline failure during sprint generation." 
    });
  }
};

// @desc    Get all sprints tied to a specific project ID context
// @route   GET /api/sprints/project/:projectId
exports.getProjectSprints = async (req, res) => {
  try {
    const { projectId } = req.params;

    const sprints = await Sprint.findAll({
      where: { project_id: Number(projectId) },
      order: [["createdAt", "DESC"]]
    });

    return res.status(200).json({
      success: true,
      data: sprints
    });
  } catch (error) {
    console.error("Fetch Sprints Error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to pull down project sprints sequence data framework." 
    });
  }
};


exports.startSprint = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { sprintId } = req.params;
    const { project_id } = req.body; // Frontend se project_id pass karenge

    if (!project_id) {
      return res.status(400).json({ 
        success: false, 
        message: "Project ID is required to bind the current sprint." 
      });
    }

    // 1. Check karo ke kya yeh sprint exist karta hai
    const targetSprint = await Sprint.findByPk(sprintId);
    if (!targetSprint) {
      return res.status(404).json({ success: false, message: "Sprint not found." });
    }

    // 2. Is project ke pehle se jo sprints 'active' hain, unhe 'completed' mark karo
    await Sprint.update(
      { status: "completed" },
      { 
        where: { project_id: Number(project_id), status: "active" },
        transaction 
      }
    );

    // 3. Naye target sprint ko 'active' status assign karo
    await Sprint.update(
      { status: "active" },
      { 
        where: { id: Number(sprintId) },
        transaction 
      }
    );

    // 4. Project table ke 'current_sprint' column ko update karo
    await Project.update(
      { current_sprint: Number(sprintId) },
      { 
        where: { id: Number(project_id) },
        transaction 
      }
    );

    // Agar sab sahi raha toh transaction commit karo
    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: `Sprint "${targetSprint.name}" is now active!`,
      currentSprintId: sprintId
    });

  } catch (error) {
    // Kisi bhi error par rollback karo taake data mismatch na ho
    await transaction.rollback();
    console.error("Error in startSprint:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error while activating sprint." 
    });
  }
};