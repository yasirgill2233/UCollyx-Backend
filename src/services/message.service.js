const { Message, User, ChannelMember, Channel } = require("../models");
const { Op, Sequelize } = require("sequelize");

const getChannelMessages = async (channelId) => {
  const messages = await Message.findAll({
    where: { channel_id: channelId },
    include: [
      {
        model: User,
        as: "Sender",
        attributes: ["id", "full_name", "email", "status", "avatar_url", "created_at", "updated_at"],
      },
    ],
    order: [["created_at", "ASC"]],
  });

  const members = await ChannelMember.findAll({
    where: { channel_id: channelId },
    include: [
      {
        model: User,
        attributes: ["id", "full_name", "email", "status","avatar_url","created_at", "updated_at"],
      },
    ],
  });

  return {
    messages,
    members: members.map(m => m.User).filter(Boolean)
  };
};

const getDMMessages = async (userId, otherUserId) => {
  return await Message.findAll({
    where: {
      [Op.or]: [
        { [Op.and]: [{ sender_id: userId }, { receiver_id: otherUserId }] },
        { [Op.and]: [{ sender_id: otherUserId }, { receiver_id: userId }] },
      ],
    },
    include: [
      {
        model: User,
        as: "Sender",
        attributes: ["id", "full_name", "email", "status","avatar_url","created_at", "updated_at"],
      },
      {
        model: User,
        as: "Receiver",
        attributes: ["id", "full_name", "email", "status","avatar_url","created_at", "updated_at"],
      },
    ],
    order: [["created_at", "ASC"]],
  });
};

const saveMessage = async ({ senderId, text, receiverId, channelId, type, files }) => {

  // Files ka data format karein (URLs ya Path)
  const attachmentsData = files ? files.map(file => ({
    filename: file.originalname,
    path: file.path,
    mimetype: file.mimetype,
    size: file.size
  })) : [];

  const message = await Message.create({
    sender_id: senderId,
    content: text,
    channel_id: type === "channel" ? channelId : null,
    receiver_id: type === "dm" ? receiverId : null,
    attachments: attachmentsData,
    sent_at: new Date(),
  });

  const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

if (type === 'channel' && channelId) {
  const result = await Channel.update(
    { 
      name: (await Channel.findByPk(channelId)).name ,
      updated_at: Sequelize.fn('NOW')
    }, 
    { 
      where: { id: channelId },
      silent: false
    }
  );
  console.log(colors.green + "Update result:", result); 
}

  return await Message.findOne({
    where: { id: message.id },
    include: [
      {
        model: User,
        as: "Sender",
        attributes: ["id", "full_name", "email", "status","avatar_url","created_at", "updated_at"],
      },
    ],
  });
};

const getUserConversations = async (userId) => {
  console.log("Fetching conversations for user ID:", userId);

  const messages = await Message.findAll({
    where: {
      channel_id: null,
      sender_id: userId,
      receiver_id: { [Op.ne]: null },
    },
    attributes: [
      [
        Message.sequelize.fn("DISTINCT", Message.sequelize.col("receiver_id")),
        "receiver_id",
      ],
    ],
    raw: true,
  });

  const uniqueReceiverIds = messages.map((m) => m.receiver_id);

  if (uniqueReceiverIds.length === 0) return [];

  return await User.findAll({
    where: {
      id: uniqueReceiverIds,
    },
    attributes: ["id", "full_name", "email", "status","avatar_url","created_at", "updated_at"],
  });
};

// Call start karne ki logic
const createCallMessage = async (data) => {
    return await Message.create({
        sender_id: data.sender_id,
        channel_id: data.channel_id || null,
        receiver_id: data.receiver_id || null,
        type: 'call',
        content: data.content || 'Video Meeting',
        call_status: 'active',
        sent_at: new Date()
    });
};

// Call end karke duration save karne ki logic
const finalizeCall = async (messageId) => {
    const message = await Message.findByPk(messageId);
    
    if (!message || message.type !== 'call') {
        throw new Error("Call record not found");
    }

    const endTime = new Date();
    const startTime = new Date(message.sent_at);
    // Calculation: (End - Start) / 1000 to get seconds
    const durationInSeconds = Math.floor((endTime - startTime) / 1000);

    return await message.update({
        call_status: 'ended',
        call_ended_at: endTime,
        call_duration: durationInSeconds
    });
};

// Schedule logic
const scheduleCallMessage = async (data) => {
  console.log(data)
    return await Message.create({
        sender_id: data.sender_id,
        channel_id: data.channel_id || null,
        receiver_id: data.receiver_id || null,
        type: 'call',
        content: data.content,
        call_status: 'scheduled',
        scheduled_at: data.scheduled_at // Ensure frontend sends ISO format
    });
};

// Function to update meeting status (e.g., from scheduled to active)
const updateMeetingStatus = async (messageId, status) => {
    const message = await Message.findByPk(messageId);
    
    if (!message || message.type !== 'call') {
        throw new Error("Meeting record not found");
    }

    return await message.update({ 
        call_status: status,
        // Agar status active ho raha hai, to sent_at ko current time set kr dain
        // taake duration sahi calculate ho sakay end pr
        ...(status === 'active' ? { sent_at: new Date() } : {})
    });
};

module.exports = {
  getChannelMessages,
  getDMMessages,
  saveMessage,
  getUserConversations,
  finalizeCall,
  createCallMessage,
  scheduleCallMessage,
  updateMeetingStatus
};