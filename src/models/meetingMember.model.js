const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const MeetingMember = sequelize.define(
  "MeetingMember",
  {
    id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
    meeting_id: {
      type: DataTypes.INTEGER,
    },
    user_id: {
      type: DataTypes.INTEGER,
    },
    role: {
      type: DataTypes.ENUM("organizer", "attendee", "observer"),
      defaultValue: "attendee",
    },
  },
  {
    timestamps: false,
    underscored: true,
  }
);

MeetingMember.associate = (models) => {
  MeetingMember.belongsTo(models.Meeting, { foreignKey: "meeting_id" });
  MeetingMember.belongsTo(models.User, { foreignKey: "user_id" });
};

module.exports = MeetingMember;