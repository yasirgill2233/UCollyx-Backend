const { Workspace, User, sequelize, WorkspaceMember } = require("../models");
const { Op } = require("sequelize");

const getAdminDashboardStats = async () => {
  const activeOrgsCount = await Workspace.count({ where: { status: 'active' } });
  const suspendedOrgsCount = await Workspace.count({ where: { status: 'suspended' } });

  const totalUsersCount = await User.count({ where: { status: 'active' } });
  
  const roleStats = await WorkspaceMember.findAll({
  attributes: [
    'role',
    [sequelize.fn('COUNT', sequelize.col('user_id')), 'count']
  ],
  where: { 
    status: 'active'
  },
  group: ['role'],
  raw: true
});

  const roleDistribution = { members: 0, managers: 0, admins: 0 };
  roleStats.forEach(item => {
    if (item.role === 'qa') roleDistribution.members = parseInt(item.count, 10);
    if (item.role === 'manager') roleDistribution.managers = parseInt(item.count, 10);
    if (item.role === 'admin' || item.role === 'org_admin') roleDistribution.admins += parseInt(item.count, 10);
  });

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