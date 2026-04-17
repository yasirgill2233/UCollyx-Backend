const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const WorkspaceMember = sequelize.define('WorkspaceMember', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    workspace_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'workspaces',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    role: {
        type: DataTypes.ENUM('manager', 'dev', 'qa','org_admin','member'),
        defaultValue: 'dev'
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'suspended'),
        defaultValue: 'active'
    },
    joined_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    // tableName: 'workspace_members',
    timestamps: true,
    underscored: true
});

WorkspaceMember.associate = (models) => {
    WorkspaceMember.belongsTo(models.User, { foreignKey: 'user_id' });
    WorkspaceMember.belongsTo(models.Workspace, { foreignKey: 'workspace_id'});
};

module.exports = WorkspaceMember;