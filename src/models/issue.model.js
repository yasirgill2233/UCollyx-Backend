const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

  const Issue = sequelize.define(
    "Issue",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      project_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      raised_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      assigned_to: {
        type: DataTypes.INTEGER,
        allowNull: false, // Shuru mein ho sakta hai unassigned ho
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      severity: {
        type: DataTypes.ENUM("Critical", "High", "Medium", "Low"),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("New", "Acknowledged", "In Progress", "Resolved", "Ready for QA"),
        defaultValue: "New",
      },
      retest_status: {
        type: DataTypes.ENUM("Pending", "Passed", "Failed"),
        defaultValue: "Pending",
      },
      steps_to_repro: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      expected_result: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      actual_result: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      environment: {
        type: DataTypes.ENUM("Production", "Staging", "Dev"),
        defaultValue: "Production",
      },
    },
    {
      underscored: true,
      timestamps: true,
    }
  );

  Issue.associate = (models) => {
    Issue.belongsTo(models.Project, { foreignKey: "project_id", as: "project" });
    Issue.belongsTo(models.User, { foreignKey: "raised_by", as: "reporter" });
    Issue.belongsTo(models.User, { foreignKey: "assigned_to", as: "assignee" });
    Issue.hasMany(models.IssueComment, { foreignKey: "issue_id", as: "comments" });
    Issue.hasMany(models.IssueAttachment, { foreignKey: "issue_id", as: "attachments" });
};

module.exports = Issue