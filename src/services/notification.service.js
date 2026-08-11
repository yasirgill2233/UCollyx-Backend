const { Notification, User, Channel } = require('../models');
const socketCore = require('../config/socket'); 

const getUserNotifications = async (userId) => {
  return await Notification.findAll({
    where: { recipient_id: userId },
    order: [['created_at', 'DESC']],
    limit: 30
  });
};

const markNotificationsAsRead = async (userId, notificationId = null) => {
  const whereClause = notificationId 
    ? { id: notificationId, recipient_id: userId } 
    : { recipient_id: userId, is_read: false };
    
  return await Notification.update({ is_read: true }, { where: whereClause });
};

const markNotificationsAllRead = async (userId) => {
  const whereClause = { recipient_id: userId, is_read: false };
  return await Notification.update({ is_read: true }, { where: whereClause });
};

const sendMentionNotification = async (text, sender, targetId, chatType, name) => {
  if (!text) return;

  const mentionRegex = /@\{([^:]+):(\d+)\}/g;
  const mentioned = await User.findOne({ where: { id: sender.id } });
  const matches = [...text.matchAll(mentionRegex)];

  if (matches.length === 0) return;

  const mentionedUserIds = [...new Set(matches.map(match => Number(match[2])))];
  
  for (let recipientId of mentionedUserIds) {
    if (recipientId === sender.id) continue;

    const content = `${mentioned?.full_name || 'Someone'} mentioned you in a ${chatType} ${
      chatType === "channel" ? '(' + name + ')' : ""
    }`;

    const newNotification = await Notification.create({
      recipient_id: recipientId,
      type: 'mention',
      content,
      target_url: `/chat/${chatType}/${name}/${targetId}`,
      is_read: false
    });

    try {
      const io = socketCore.getIO();
      const roomName = `user_room:${recipientId}`;
      io.to(roomName).emit("notification:received", newNotification);
      console.log(`📡 [Mention Event] Pushed successfully to: ${roomName}`);
    } catch (socketError) {
      console.error("❌ Socket engine failed to emit mention:", socketError.message);
    }
  }
};

const sendDMNotification = async (sender, receiverId, text, name) => {
  const user = await User.findOne({ where: { id: sender.id } });
  if (sender.id === parseInt(receiverId)) return;

  const newNotification = await Notification.create({
    recipient_id: receiverId,
    type: 'dm',
    content: `New message from ${user.full_name}`,
    target_url: `/chat/dm/${name}/${sender.id}`,
    is_read: false
  });

  try {
    const io = socketCore.getIO();
    const roomName = `user_room:${receiverId}`;
    io.to(roomName).emit("notification:received", newNotification);
    console.log(`📡 [DM Event] Pushed successfully to: ${roomName}`);
  } catch (socketError) {
    console.error("❌ Socket engine failed to emit DM notification:", socketError.message);
  }
};

const sendJoinNotification = async (channelId, userId, role) => {
  const channel = await Channel.findOne({ where: { id: channelId } });

  const newNotification = await Notification.create({
    recipient_id: userId,
    type: 'join',
    content: `Welcome! You have been added to ${channel.name}`,
    target_url: `/chat/channel/${channel.name}/${channel.id}`,
    is_read: false
  });

  try {
    const io = socketCore.getIO();
    const roomName = `user_room:${userId}`;
    io.to(roomName).emit("notification:received", newNotification);
    console.log(`📡 [Join Event] Pushed successfully to: ${roomName}`);
  } catch (socketError) {
    console.error("❌ Socket engine failed to emit join notification:", socketError.message);
  }
};

module.exports = {
  getUserNotifications,
  markNotificationsAsRead,
  sendMentionNotification,
  sendDMNotification,
  sendJoinNotification,
  markNotificationsAllRead
};