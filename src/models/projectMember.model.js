const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ProjectMember = sequelize.define('ProjectMember', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'projects', key: 'id' }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  project_role: {
    type: DataTypes.ENUM('Member', 'Manager'),
    allowNull: false
  }
}, {
//   tableName: 'project_members',
  underscored: true,
  timestamps: true
});


// ProjectMember.js ke end mein
ProjectMember.associate = (models) => {
  ProjectMember.belongsTo(models.User, { foreignKey: 'user_id' });
  ProjectMember.belongsTo(models.Project, { foreignKey: 'project_id' });
};


module.exports = ProjectMember;