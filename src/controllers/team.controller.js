const teamService = require('../services/team.service');

exports.getTeamActivity = async (req, res, next) => {
  try {
    const data = await teamService.getTeamActivityData();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};