const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const JoinRequest = sequelize.define('JoinRequest', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
    },
    workspace_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'workspaces', key: 'id' },
        onDelete: 'CASCADE'
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending'
    },
    processed_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    // tableName: 'join_requests',
    timestamps: true, // requested_at ki jagah createdAt use ho jayega
    underscored: true
});

JoinRequest.associate = (models) => {
    JoinRequest.belongsTo(models.User, { foreignKey: 'user_id'});
    JoinRequest.belongsTo(models.Workspace, { foreignKey: 'workspace_id'});
};

module.exports = JoinRequest;