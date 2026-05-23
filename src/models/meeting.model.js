const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Meeting = sequelize.define(
  "Meeting",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Project se link filtering ke liye
      references: {
        model: "projects",
        key: "id",
      },
    },
    // task_id: {
    //   type: DataTypes.STRING(50),
    //   allowNull: true, // Specific task meeting ke liye
    //   references: {
    //     model: "tasks",
    //     key: "id",
    //   },
    // },
    start_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    duration: {
      type: DataTypes.STRING(20),
      defaultValue: "30 min",
    },
    meeting_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("scheduled", "live", "completed", "cancelled"),
      defaultValue: "scheduled",
    },
    recap_notes: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
  },
  {
    timestamps: true,
    underscored: true,
  },
);

Meeting.associate = (models) => {
  Meeting.belongsTo(models.Project, { foreignKey: "project_id" });

  Meeting.belongsTo(models.User, { foreignKey: "created_by", as: "Creator" });
  Meeting.belongsToMany(models.User, {
    through: models.MeetingMember,
    foreignKey: "meeting_id",
    as: "Participants",
  });
};

module.exports = Meeting;
