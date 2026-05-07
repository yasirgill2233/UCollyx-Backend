const messageService = require("../services/message.service");
const notificationService = require("../services/notification.service");

// 1. Channel ke messages fetch karna
const getChannelMessages = async (req, res) => {
  try {
    const { channelId } = req.params;
    const messages = await messageService.getChannelMessages(channelId);

    console.log(`Fetched ${messages.members}`);

    return res.status(200).json({ success: true, data: messages });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. DM ke messages fetch karna
const getDMMessages = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId } = req.params;

    const messages = await messageService.getDMMessages(senderId, receiverId);

    return res.status(200).json({ success: true, data: messages });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id; // Auth middleware se logged-in user ki ID
    const sender = req.user;
    const { text, receiverId, channelId, type, name } = req.body;
    const files = req.files;

    // Text ya Files mein se aik cheez lazmi honi chahiye
    if ((!text || !text.trim()) && (!files || files.length === 0)) {
      return res.status(400).json({ success: false, message: "Message content or file is required" });
    }

    // if (!text || !text.trim()) {
    //   return res
    //     .status(400)
    //     .json({ success: false, message: "Message text is required" });
    // }

    const message = await messageService.saveMessage({
      senderId,
      text,
      receiverId,
      channelId,
      type,
      files
    });

    await notificationService.sendMentionNotification(
      text,
      sender,
      channelId || receiverId,
      channelId ? "channel" : "dm",
      name
    );

    // Agar DM hai aur koi mention nahi hua, toh simple DM notification bhejien
    if (type === "dm" && receiverId) {
      // Yahan aap logic check laga sakte hain ke agar mention notify ho chuka ha to dubara na ho
      await notificationService.sendDMNotification(sender, receiverId, text,name);
    }

    console.log("Message sent:", message, "Type:", type ==="dm", receiverId, sender);

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    console.error("Send message error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getConversations = async (req, res) => {
  try {
    const userId = req.user.id; // Logged-in user ki ID

    const participants = await messageService.getUserConversations(userId);

    console.log("Conversations fetched:", participants.length);

    return res.status(200).json({
      success: true,
      data: participants,
    });
  } catch (error) {
    console.error("Fetch conversations error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getChannelMessages,
  getDMMessages,
  sendMessage,
  getConversations,
};
