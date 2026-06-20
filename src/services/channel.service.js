const { sequelize, Channel, ChannelMember, User, Workspace, WorkspaceMember } = require('../models');

const createChannel = async (channelData, creatorId) => {
  console.log("Channel data in service:", channelData);
  let cleanName = channelData.name.toLowerCase().trim();
  if (!cleanName.startsWith('#')) {
    cleanName = `#${cleanName.replace(/[^a-zA-Z0-9]+/g, "-")}`;
  } else {
    cleanName = `#${cleanName.substring(1).replace(/[^a-zA-Z0-9]+/g, "-")}`;
  }

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
    const channel = await Channel.create({
      name: cleanName,
      description: channelData.description || null,
      type: channelData.is_private ? 'private' : 'public',
      is_private: channelData.is_private || false,
      created_by: creatorId
    }, { transaction: t });

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


const getUserChannels = async (userId, workspaceId) => {
  try {
    console.log(`📡 Fetching accurate workspace channels for User: ${userId} in Workspace: ${workspaceId}`);

    return await Channel.findAll({
      distinct: true, 
      include: [
        {
          model: ChannelMember,

          required: true, 
          where: { user_id: userId },
          attributes: []
        },
        {
          model: User,
       
          required: true,
          attributes: [],
          include: [
            {
              model: Workspace,
         
              required: true,
              where: { id: workspaceId },
              attributes: [],
              through: {
                attributes: []
              }
            }
          ]
        }
      ],
      order: [['updated_at', 'DESC']]
    });

  } catch (error) {
    console.error("❌ Error inside getUserChannels service:", error.message);
    throw error;
  }
};

const addUserToChannel = async (channelId, userId, role = 'member') => {
  const existingMember = await ChannelMember.findOne({
    where: { channel_id: channelId, user_id: userId }
  });

  if (existingMember) {
    const error = new Error('User is already a member of this channel');
    error.status = 400;
    throw error;
  }

  const member = await ChannelMember.create({
    channel_id: channelId,
    user_id: userId,
    role_in_channel: role || 'member',
    is_muted: false
  });

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

const fetchMembers = async (channelId, workspaceId) => {
  try {
    console.log(`📡 Fetching channel members for Channel: ${channelId} within Workspace: ${workspaceId}`);

    return await ChannelMember.findAll({
      where: { 
        channel_id: channelId 
      },
      distinct: true, 
      include: [
        {
          model: User,
          required: true, 
          attributes: ['id', 'full_name', 'email', 'avatar_url', 'status', 'created_at', 'updated_at'],
          include: [
            {
              model: Workspace,
              required: true,
              where: {
                id: workspaceId
              },
              through: {
                model: WorkspaceMember,
                attributes: []
              },
              attributes: []
            }
          ]
        }
      ]
    });

  } catch (error) {
    console.error("❌ Error inside fetchMembers service:", error.message);
    throw error;
  }
};

module.exports = {
  createChannel,
  getUserChannels,
  addUserToChannel,
  fetchMembers
};