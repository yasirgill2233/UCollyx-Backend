const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  recipient_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('mention', 'dm', 'channel', 'join', 'file', 'reaction'),
    allowNull: false
  },
  content: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  target_url: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  timestamps: true,
  underscored: true,
});

Notification.associate = (models) => {
  Notification.belongsTo(models.User, {
    foreignKey: 'recipient_id',
  });
};

module.exports = Notification;