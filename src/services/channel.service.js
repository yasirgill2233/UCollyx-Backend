const { sequelize, Channel, ChannelMember, User } = require('../models');

const createChannel = async (channelData, creatorId) => {
  // 1. Clean Channel Name (e.g. #general ya design-reviews)
  console.log("Channel data in service:", channelData);
  let cleanName = channelData.name.toLowerCase().trim();
  if (!cleanName.startsWith('#')) {
    cleanName = `#${cleanName.replace(/[^a-zA-Z0-9]+/g, "-")}`;
  } else {
    cleanName = `#${cleanName.substring(1).replace(/[^a-zA-Z0-9]+/g, "-")}`;
  }

  // 2. Name uniqueness check karein
  const existingChannel = await Channel.findOne({
    where: { name: cleanName }
  });

  if (existingChannel) {
    const error = new Error('A channel with this name already exists');
    error.status = 400;
    throw error;
  }

  const t = await sequelize.transaction();

  try {
    // 3. Create Channel
    const channel = await Channel.create({
      name: cleanName,
      description: channelData.description || null,
      type: channelData.is_private ? 'private' : 'public',
      is_private: channelData.is_private || false,
      created_by: creatorId
    }, { transaction: t });

    // 4. Add creator to channel members as an 'admin'
    await ChannelMember.create({
      channel_id: channel.id,
      user_id: creatorId,
      role_in_channel: 'admin',
      is_muted: false
    }, { transaction: t });

    await t.commit();
    return channel;

  } catch (error) {
    await t.rollback();
    throw error;
  }
};

const getUserChannels = async (userId) => {
  // 1. Pehle user ke joined channels ki IDs nikalen
  const joinedChannels = await ChannelMember.findAll({
    where: { user_id: userId },
    attributes: ['channel_id']
  });

  const channelIds = joinedChannels.map(cm => cm.channel_id);

  if (channelIds.length === 0) return [];

  // 2. Un IDs ke mutabiq channels ka saara data fetch karein
  return await Channel.findAll({
    where: {
      id: channelIds
    },
    order: [['updated_at', 'DESC']]
  });
};


const addUserToChannel = async (channelId, userId, role = 'member') => {
  // 1. Check karein ke user pehle se added toh nahi hai

  console.log(channelId, userId, role)
  const existingMember = await ChannelMember.findOne({
    where: { channel_id: channelId, user_id: userId }
  });

  if (existingMember) {
    const error = new Error('User is already a member of this channel');
    error.status = 400;
    throw error;
  }

  // 2. Member create karein
  const member = await ChannelMember.create({
    channel_id: channelId,
    user_id: userId,
    role_in_channel: role || 'member',
    is_muted: false
  });

  // 3. Complete user details ke saath data return karein
  return await ChannelMember.findOne({
    where: { user_id: member.user_id },
    include: [
      {
        model: User,
        attributes: ['id', 'full_name', 'email', 'status']
      }
    ]
  });
};

module.exports = {
  createChannel,
  getUserChannels,
  addUserToChannel
};