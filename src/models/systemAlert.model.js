const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

// 2. System Alerts Model
const SystemAlert = sequelize.define(
  "SystemAlert",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    workspace_id: { type: DataTypes.INTEGER, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    severity: {
      type: DataTypes.ENUM("low", "high", "critical"),
      allowNull: false,
    },
    is_resolved: { type: DataTypes.BOOLEAN, defaultValue: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { timestamps: false, underscored: true },
);

SystemAlert.associate = (models) => {
  SystemAlert.belongsTo(models.Workspace, { foreignKey: "workspace_id" });
};

module.exports = SystemAlert;
