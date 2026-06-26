const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Deployment = sequelize.define("Deployment", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    version: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    env: {
      type: DataTypes.ENUM("prod", "staging", "dev"),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("Success", "Failed", "Pending"),
      allowNull: false,
    },
    trigger: {
      type: DataTypes.ENUM("Auto", "Manual"),
      defaultValue: "Auto",
    },
    log_output: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    deployed_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, 
  {
    timestamps: false,
    underscored: true,
  },
);

module.exports = Deployment;