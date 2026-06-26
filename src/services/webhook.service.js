const { Deployment } = require("../models");


const logAndBroadcastPipeline = async (payload) => {
  const { project_id, status, log_summary, version, env, log_output } = payload;

  // MySQL ENUM constraints ('Success', 'Failed') ke sath status match karo
  const normalizedStatus = status.toLowerCase() === "success" || status.toLowerCase() === "passed" ? "Success" : "Failed";

  // 1. Save data to MySQL via Sequelize
  const newDeployment = await Deployment.create({
    project_id: Number(project_id),
    version: version || "v1.0.0",
    env: env || "prod",
    status: normalizedStatus,
    trigger: "Auto",
    log_output: log_output || log_summary
  });

  // 2. Real-time Socket Dispatch
  if (global.io) {
    const roomName = `project_room:${project_id}`;

    global.io.to(roomName).emit("pipeline:status_received", {
      project_id: Number(project_id),
      version: newDeployment.version,
      env: newDeployment.env,
      status: newDeployment.status, 
      log_summary,
    });

    console.log(`📡 Real-Time Socket Broadcast executed for Pipeline in Room: ${roomName}`);
  } else {
    console.log("⚠️ global.io is not initialized on backend!");
  }

  return newDeployment;
};

module.exports = {
  logAndBroadcastPipeline
};