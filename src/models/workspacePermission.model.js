const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');


  const WorkspacePermission = sequelize.define('WorkspacePermission', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    workspaceSlug: {
      type: DataTypes.STRING,
      allowNull: false
    },
    permissionId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    }
  }, {
    underscored: true,
    timestamps: true
  });

  module.exports =  WorkspacePermission;
