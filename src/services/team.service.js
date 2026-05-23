const { User, Task, Project } = require('../models');
const { Sequelize } = require('sequelize');

exports.getTeamActivityData = async () => {
  // Sabhi users aur unke tasks ka count fetch karein
  // src/services/team.service.js

const users = await User.findAll({
  attributes: ['id', 'name', 'email', 'role'],
  include: [{
    model: Task,
    attributes: ['id', 'status', 'title', 'priority'],
    include: [{ 
      model: Project, 
      attributes: ['name'] 
    }]
  }]
});

  // Dynamic Workload Calculation
  return users.map(user => {
    const tasks = user.Tasks || [];
    const totalTasks = tasks.length;
    // Assume 15 tasks is the 'Balanced' capacity (100%)
    const percentage = Math.round((totalTasks / 15) * 100);
    
    let status = "Balanced";
    let color = "bg-green-500";
    if (percentage > 120) { status = "Overloaded"; color = "bg-red-500"; }
    else if (percentage < 50) { status = "Underutilized"; color = "bg-yellow-500"; }

    return {
      ...user.toJSON(),
      tasks: `${totalTasks}/${15}`,
      percentage,
      status,
      color,
      projects: [...new Set(tasks.map(t => t.Project?.name).filter(Boolean))]
    };
  });
};