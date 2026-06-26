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
    sprint_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Nullable kyunki task shuru mein master backlog pool mein ho sakta hai
      references: {
        model: "sprints", // Jab table sync ya create ho, toh database exact table target kare
        key: "id",
      },
      onDelete: "SET NULL", // Agar sprint delete ho jaye, toh task safe rahe aur null ho jaye
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

  Task.belongsTo(models.Sprint, { foreignKey: "sprint_id", as: "sprint" });

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
