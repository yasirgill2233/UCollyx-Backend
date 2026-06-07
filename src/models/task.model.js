const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Task = sequelize.define(
  "Task",
  {
    id: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      autoIncrement: false,
      defaultValue: () => `task-${Date.now()}`
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    status: {
      type: DataTypes.ENUM("backlog", "todo", "inprogress", "review", "done"),
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM("Low", "Medium", "High"),
      defaultValue: "Low",
    },
    type: {
      type: DataTypes.ENUM("task", "bug", "story", "epic"),
      defaultValue: "task",
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    parent_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    due_time: {
      type: DataTypes.DATE,
    },
  },
  {
    timestamps: true,
    underscored: true,
  },
);

Task.associate = (models) => {
  Task.belongsTo(models.Project, { foreignKey: "project_id" });

  Task.belongsToMany(models.User, {
    through: models.TaskAssignee,
    foreignKey: "task_id",
    as: "assignees",
  });

  Task.hasMany(models.Subtask, { foreignKey: "task_id", as: "subtasks" });
  Task.hasMany(models.TaskComment, { foreignKey: "task_id", as: "comments" });

  Task.belongsTo(models.Task, { as: "ParentTask", foreignKey: "parent_id" });
  Task.hasMany(models.Task, { as: "ChildTasks", foreignKey: "parent_id" });

  Task.hasOne(models.Epic, { foreignKey: "id" });

  Task.belongsTo(models.Project, {
    foreignKey: "project_id",
  });
};

module.exports = Task;
