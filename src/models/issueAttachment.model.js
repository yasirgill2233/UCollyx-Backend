const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const IssueAttachment = sequelize.define(
  "IssueAttachment",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    issue_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    file_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    file_url: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    underscored: true,
    timestamps: true,
    updatedAt: false,
  },
);

IssueAttachment.associate = (models) => {
  IssueAttachment.belongsTo(models.Issue, {
    foreignKey: "issue_id",
    as: "issue",
  });
};

module.exports = IssueAttachment;
