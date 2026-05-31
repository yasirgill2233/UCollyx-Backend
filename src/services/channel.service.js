const { sequelize, Channel, ChannelMember, User, Workspace, WorkspaceMember } = require('../models');

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

// const getUserChannels = async (userId) => {
//   // 1. Pehle user ke joined channels ki IDs nikalen
//   const joinedChannels = await ChannelMember.findAll({
//     where: { user_id: userId },
//     attributes: ['channel_id']
//   });

//   const channelIds = joinedChannels.map(cm => cm.channel_id);

//   if (channelIds.length === 0) return [];

//   // 2. Un IDs ke mutabiq channels ka saara data fetch karein
//   return await Channel.findAll({
//     where: {
//       id: channelIds
//     },
//     order: [['updated_at', 'DESC']]
//   });
// };

const getUserChannels = async (userId, workspaceId) => {
  try {
    console.log(`📡 Fetching accurate workspace channels for User: ${userId} in Workspace: ${workspaceId}`);

    // Seedha Channel table se find karo taake dynamic properties asani se mapping handle karein
    return await Channel.findAll({
      distinct: true, // Joins ki wajah se duplicates prevent karne ke liye
      include: [
        {
          // 🛑 CONSTRAINT 1: User khud is channel ka member hona chahiye
          model: ChannelMember,

          required: true, 
          where: { user_id: userId },
          attributes: [] // Payload clean rakhne ke liye bridge data skip kiya
        },
        {
          // 🛑 CONSTRAINT 2: Is channel ka creator jis workspace me ha, wo match ho strictly
          model: User,
       
          required: true,
          attributes: [],
          include: [
            {
              model: Workspace,
         
              required: true,
              where: { id: workspaceId }, // 🔥 Strict active workspace identity check
              attributes: [],
              through: {
                attributes: [] // workspace_members columns drop kiye
              }
            }
          ]
        }
      ],
      order: [['updated_at', 'DESC']] // Latest updated channels top par [cite: 83]
    });

  } catch (error) {
    console.error("❌ Error inside getUserChannels service:", error.message);
    throw error;
  }
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

// const fetchMembers = async (channelId) => {
//   return await ChannelMember.findAll({
//     where: { channel_id: channelId },
//     include: [
//       {
//         model: User,
//         attributes: ['id', 'full_name', 'email', 'avatar_url', 'status', "created_at", "updated_at",]
//       }
//     ]
//   });
// };


const fetchMembers = async (channelId, workspaceId) => {
  try {
    console.log(`📡 Fetching channel members for Channel: ${channelId} within Workspace: ${workspaceId}`);

    return await ChannelMember.findAll({
      where: { 
        channel_id: channelId 
      },
      // Duplication ko avoid karne ke liye distinct apply kiya
      distinct: true, 
      include: [
        {
          model: User,
          // required: true se inner join bnega taake strict validation ho
          required: true, 
          attributes: ['id', 'full_name', 'email', 'avatar_url', 'status', 'created_at', 'updated_at'], // users table ke columns[cite: 1]
          include: [
            {
              // 🎯 MANY-TO-MANY RELATION: Directly Workspace target kiya[cite: 1]
              model: Workspace,
              // as: "Workspaces", // 👈 Agar aapne User model me belongsToMany pr alias diya ha to likhein
              required: true, // Strict Inner Join taake target workspace lazmi match ho
              where: {
                id: workspaceId // 🔥 STRICT WORKSPACE BOUNDARY FILTER
              },
              through: {
                model: WorkspaceMember, // Junction/Bridge table framework[cite: 1]
                attributes: [] // Humen mapping columns array me nahi chahiye
              },
              attributes: [] // Workspace ke data fields hide rakhe taake payload clean rahe
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