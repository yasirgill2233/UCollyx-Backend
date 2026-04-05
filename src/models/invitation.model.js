const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Invitation = sequelize.define('Invitation', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    workspace_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'workspaces', key: 'id' },
        onDelete: 'CASCADE'
    },
    invited_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' }
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: { isEmail: true }
    },
    token: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'accepted', 'expired'),
        defaultValue: 'pending'
    }
}, {
    // tableName: 'invitations',
    timestamps: true,
    underscored: true
});

Invitation.associate = (models) => {
    Invitation.belongsTo(models.Workspace, { foreignKey: 'workspace_id'});
    Invitation.belongsTo(models.User, { foreignKey: 'invited_by'});
};

module.exports = Invitation;