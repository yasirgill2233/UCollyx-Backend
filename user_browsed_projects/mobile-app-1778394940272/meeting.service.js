const { Meeting, MeetingMember, User, Project } = require("../models");

const createMeeting = async (meetingData, creatorId) => {
  const {
    title,
    project_id,
    start_time,
    end_time,
    task_id,
    created_by,
    duration,
    participants,
  } = meetingData;

  console.log(participants);

  // Jitsi unique room name generation
  const meeting_url = `https://meet.jit.si/${title.replace(/\s+/g, "-")}-${Date.now()}`;

  const newMeeting = await Meeting.create({
    title,
    project_id,
    task_id,
    start_time,
    end_time,
    duration,
    meeting_url,
    created_by,
    status: "scheduled",
  });

  if (participants && participants.length > 0) {
    const participantData = participants.map((uid) => ({
      meeting_id: newMeeting.id,
      user_id: uid.user_id,
      role: uid.role,
    }));

    participantData.push({
      meeting_id: newMeeting.id,
      user_id: creatorId,
      role: "organizer",
    });

    try {
  console.log("Saving Participants:", participantData);
  await MeetingMember.bulkCreate(participantData);
} catch (error) {
  console.error("DETAILED DB ERROR:", error.name, error.parent); // Is se exact SQL error milega
  return res.status(500).json({ 
    message: "Failed to add participants", 
    details: error.parent?.sqlMessage || error.message 
  });
}
  }

  return newMeeting;
};

const fetchAllMeetings = async (id) => {
  return await Meeting.findAll({
    include: [
      { model: Project, attributes: ["id", "name"] },
      {
        model: User,
        as: "Participants",
        through: { attributes: ["role"], where: { user_id: id } },
        required: true,
        attributes: ["id", "full_name", "avatar_url"],
      },
    ],
    order: [["start_time", "ASC"]],
  });
};

module.exports = {
  createMeeting,
  fetchAllMeetings,
};
