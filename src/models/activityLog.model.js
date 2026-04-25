const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const ActivityLog = sequelize.define(
  "ActivityLog",
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    workspace_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    action_type: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { timestamps: false, underscored: true },
);

ActivityLog.associate = (models) => {
  ActivityLog.belongsTo(models.Workspace, { foreignKey: "workspace_id" });
  ActivityLog.belongsTo(models.User, { foreignKey: "user_id" });
};

module.exports = ActivityLog;
