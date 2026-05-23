const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const IssueComment = sequelize.define(
  "IssueComment",
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
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    comment_text: {
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

IssueComment.associate = (models) => {
  IssueComment.belongsTo(models.Issue, { foreignKey: "issue_id", as: "issue" });
  IssueComment.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
};

module.exports = IssueComment;
