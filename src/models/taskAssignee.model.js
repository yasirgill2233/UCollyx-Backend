const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const TaskAssignee = sequelize.define(
  "TaskAssignee",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true, // Auto incremental Primary Key 🔥
    //   allowNull: false,
    },
    task_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: "tasks",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
  },
  {
    timestamps: true,
    underscored: true,
  },
);

module.exports = TaskAssignee;
