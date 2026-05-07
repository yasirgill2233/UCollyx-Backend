const notificationService = require('../services/notification.service');

const getNotifications = async (req, res) => {
  try {
    const data = await notificationService.getUserNotifications(req.user.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateReadStatus = async (req, res) => {
  try {
    const { id } = req.body; 
    await notificationService.markNotificationsAsRead(req.user.id, id);
    res.status(200).json({ success: true, message: "Notifications updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await notificationService.markNotificationsAllRead(req.user.id);
    res.status(200).json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const sendMessage = async (req, res) => {
  try {
    const { text, channelId, receiverId, type } = req.body;
    const sender = req.user; 

    // 1. Message save karein
    const newMessage = await Message.create({
        sender_id: sender.id,
        content: text,
        channel_id:channelId,
        receiver_id:receiverId,
        type
    });

    // 2. Notification Logic Trigger karein
    // Mention scan karein
    await notificationService.sendMentionNotification(
      text, 
      sender, 
      channel_id || receiver_id, 
      channel_id ? 'channel' : 'dm'
    );

    // Agar DM hai aur koi mention nahi hua, toh simple DM notification bhejien
    if (type === 'dm' && receiver_id) {
        // Yahan aap logic check laga sakte hain ke agar mention notify ho chuka ha to dubara na ho
        await notificationService.sendDMNotification(sender, receiver_id, text);
    }

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: newMessage
    });
  } catch (error) {
    console.error("Send message error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getNotifications,
  updateReadStatus,
  sendMessage,
  markAllAsRead
};