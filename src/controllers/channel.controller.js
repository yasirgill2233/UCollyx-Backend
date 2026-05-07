const channelService = require('../services/channel.service');
const notificationServices = require('../services/notification.service');

const createChannel = async (req, res) => {
  try {
    const creatorId = req.user.id; // Auth middleware se user ID milegi

    const channel = await channelService.createChannel(req.body, creatorId);

    return res.status(201).json({
      success: true,
      message: "Channel created successfully",
      data: channel
    });
  } catch (error) {
    console.error("Channel controller error:", error);
    
    if (error.status === 400) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: [{ field: "name", message: error.message }]
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getMyChannels = async (req, res) => {
  try {
    const userId = req.user.id; // Auth middleware se user ID milegi

    const channels = await channelService.getUserChannels(userId);

    return res.status(200).json({
      success: true,
      data: channels
    });
  } catch (error) {
    console.error("Fetch user channels error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const addChannelMember = async (req, res) => {
  console.log("Add member request body:", req.body);
  try {
    const { channelId, userId, role } = req.body;


    if (!channelId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Channel ID and User ID are required."
      });
    }

    const newMember = await channelService.addUserToChannel(channelId, userId, role);

    await notificationServices.sendJoinNotification(channelId, userId, role);

    return res.status(201).json({
      success: true,
      message: "Member added to channel successfully",
      data: newMember
    });
  } catch (error) {
    console.error("Add channel member error:", error);
    if (error.status === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createChannel,
  getMyChannels,
  addChannelMember
};