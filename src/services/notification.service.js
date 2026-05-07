const { Notification, User, Channel } = require('../models');

// 1. Mentions create karne ka function
// const createMentionNotifications = async (text, sender, targetId, chatType) => {
//   try {
//     const mentionRegex = /@(\w+)/g;
//     const mentions = text.match(mentionRegex);

//     if (!mentions) return null;

//     const uniqueMentions = [...new Set(mentions)];

//     for (let mention of uniqueMentions) {
//       const nameToFind = mention.substring(1);
//       const mentionedUser = await User.findOne({ where: { full_name: nameToFind } });

//       // Apne aap ko notification nahi bhejni
//       if (mentionedUser && mentionedUser.id !== sender.id) {
//         await Notification.create({
//           recipient_id: mentionedUser.id,
//           type: 'mention',
//           content: `${sender.full_name} mentioned you in a ${chatType}`,
//           target_url: `/chat/${chatType}/${targetId}`,
//           is_read: false
//         });
//       }
//     }
//   } catch (error) {
//     console.error("Error creating mention notification:", error);
//   }
// };

// 2. Notifications fetch karne ka function
const getUserNotifications = async (userId) => {
  return await Notification.findAll({
    where: { recipient_id: userId },
    order: [['created_at', 'DESC']],
    limit: 30
  });
};

// 3. Mark as read ka function
const markNotificationsAsRead = async (userId, notificationId = null) => {
  const whereClause = notificationId 
    ? { id: notificationId, recipient_id: userId } 
    : { recipient_id: userId, is_read: false };
    
  return await Notification.update({ is_read: true }, { where: whereClause });
};

// 3. Mark as read ka function
const markNotificationsAllRead = async (userId) => {
  const whereClause = { recipient_id: userId, is_read: false };
    
  return await Notification.update({ is_read: true }, { where: whereClause });
};

// --- 1. MENTION NOTIFICATION LOGIC ---
const sendMentionNotification = async (text, sender, targetId, chatType, name) => {

  console.log("Mention notification trigger:", { text, sender: sender.id, targetId, chatType, name });
  const mentionRegex = /@(\w+)/g;
  const mentions = text.match(mentionRegex);
  if (!mentions) return;

  console.log("Mentions:",mentions)

  const uniqueMentions = [...new Set(mentions)];
  for (let mention of uniqueMentions) {
    const nameToFind = mention.substring(1);
    const mentionedUser = await User.findOne({ where: { id: sender.id } });

    console.log(`Checking mention: ${mention} -> Found user:`, mentionedUser ? sender : "No user");

    if (mentionedUser && mentionedUser.id === sender.id) {
      await Notification.create({
        recipient_id: mentionedUser.id,
        type: 'mention',
        content: `${mentionedUser?.full_name} mentioned you in a ${chatType} [${name}]`,
        target_url: `/chat/${chatType}/${name}/${targetId}`,
        is_read: false
      });
    }
  }
};

// --- 2. DIRECT MESSAGE (DM) NOTIFICATION ---
const sendDMNotification = async (sender, receiverId, text, name) => {

  const user = await User.findOne({ where: { id: sender.id } });

  if (sender.id === parseInt(receiverId)) return;

  console.log(`Sending DM notification from ${sender.id} to user ID ${receiverId}`);

  await Notification.create({
    recipient_id: receiverId,
    type: 'dm',
    content: `New message from ${user.full_name}`,
    target_url: `/chat/dm/${name}/${sender.id}`,
    is_read: false
  });
};

// --- 3. CHANNEL JOIN NOTIFICATION ---
const sendJoinNotification = async (channelId, userId, role) => {
  const channel = await Channel.findOne({ where: { id: channelId } });

  console.log(`Sending join notification to user ID ${userId} for channel #${channel.name} with role ${role}`);
  await Notification.create({
    recipient_id: userId,
    type: 'join',
    content: `Welcome! You have been added to ${channel.name}`,
    target_url: `/chat/channel/${channel.name}/${channel.id}`,
    is_read: false
  });
};

module.exports = {
  // createMentionNotifications,
  getUserNotifications,
  markNotificationsAsRead,
  sendMentionNotification,
  sendDMNotification,
  sendJoinNotification,
  markNotificationsAllRead
};