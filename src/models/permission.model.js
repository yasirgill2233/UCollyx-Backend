const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');


  const Permission = sequelize.define('Permission', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    role: {
      // 📝 Underscores hata diye taake frontend matching ho jaye
      type: DataTypes.ENUM('dev', 'manager', 'qa', 'orgadmin', 'superadmin'),
      allowNull: false
    },
    label: {
      type: DataTypes.STRING, // e.g., 'IDE', 'Chat', 'Overview'
      allowNull: false
    },
    route: {
      type: DataTypes.STRING, // e.g., '/dev/ide'
      allowNull: false
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    }
  }, {
    tableName: 'permissions',
    timestamps: true
  });

module.exports = Permission;