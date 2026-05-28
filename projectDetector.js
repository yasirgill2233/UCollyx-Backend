// projectDetector.js (Single Source of Truth)
const activePortsMemory = {}; 

const registerRuntimePort = (projectId, port) => {
  if (projectId && port) {
    activePortsMemory[projectId] = parseInt(port, 10);
    console.log(`🎯 [UCollyx Core]: Locked Project [${projectId}] to User Dynamic Port [${port}]`);
  }
};

const getProjectMeta = (projectPath, projectId) => {
  const savedPort = activePortsMemory[projectId] || 5174;
  return { type: 'dynamic-runtime', port: savedPort };
};

module.exports = { getProjectMeta, registerRuntimePort, activePortsMemory };