const { Workspace, User, sequelize, WorkspaceMember } = require("../models");
const { Op } = require("sequelize");

const getAdminDashboardStats = async () => {
  // 1. Fetch Workspace Counts (Active & Suspended)
  const activeOrgsCount = await Workspace.count({ where: { status: 'active' } });
  const suspendedOrgsCount = await Workspace.count({ where: { status: 'suspended' } });

  
  // 2. Total Users Check
  const totalUsersCount = await User.count({ where: { status: 'active' } });
  
  // 3. Role Distribution Mapping
  const roleStats = await WorkspaceMember.findAll({
  attributes: [
    'role', // WorkspaceMember table ka role column (e.g., 'admin', 'member', etc.)
    [sequelize.fn('COUNT', sequelize.col('user_id')), 'count'] // Users ko count karne k liye
  ],
  where: { 
    status: 'active' // Sirf active workspace members ko uthane k liye
  },
  group: ['role'], // Role ke mutabiq grouping
  raw: true
});

  // Default distribution template initialize karein
  const roleDistribution = { members: 0, managers: 0, admins: 0 };
  roleStats.forEach(item => {
    if (item.role === 'qa') roleDistribution.members = parseInt(item.count, 10);
    if (item.role === 'manager') roleDistribution.managers = parseInt(item.count, 10);
    if (item.role === 'admin' || item.role === 'org_admin') roleDistribution.admins += parseInt(item.count, 10);
  });


  
  
  // 4. Growth Trends Analysis (Last 6 Months Dynamic Grouping)
  const growthTrends = await Workspace.findAll({
    attributes: [
      [sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), '%b'), 'name'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'active']
    ],
    where: {
      status: 'active',

      created_at: { [Op.gte]: sequelize.literal('NOW() - INTERVAL 6 MONTH') }
    },
    group: [sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), '%b')],
    raw: true
  });

  console.log(activeOrgsCount, suspendedOrgsCount, totalUsersCount, roleStats, roleDistribution, growthTrends)
  // Note: 'suspended' metric ke liye bhi isi tarah conditional count run kiya ja sakta ha.

  return {
    stats: {
      activeOrgs: activeOrgsCount,
      suspendedOrgs: suspendedOrgsCount,
      totalUsers: totalUsersCount,
      roleDistribution
    },
    chartData: growthTrends.length > 0 ? growthTrends : [
      { name: 'Jan', active: 0 }, { name: 'Feb', active: 0 }, { name: 'Mar', active: 0 }
    ]
  };
};

module.exports = {
  getAdminDashboardStats
};