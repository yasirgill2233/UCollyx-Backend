const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Workspace = sequelize.define('Workspace', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    slug: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    status: {
        type: DataTypes.ENUM('active', 'suspended', 'Pending', 'trial'),
        defaultValue: 'active'
    },
    owner_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    logo_url: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    timezone: {
        type: DataTypes.STRING(100),
        defaultValue: 'UTC'
    },
    invite_code: {
        type: DataTypes.STRING(10),
        unique: true
    }
}, {
    // tableName: 'workspaces',
    timestamps: true,
    underscored: true
});

Workspace.associate = (models) => {
    Workspace.belongsTo(models.User, { foreignKey: 'owner_id' });
    Workspace.hasOne(models.Tenant, { foreignKey: 'workspace_id'});
    Workspace.belongsToMany(models.User, { through: models.WorkspaceMember, foreignKey: 'workspace_id', otherKey: 'user_id' });
    // Is workspace mein kitne log invited hain?
    Workspace.hasMany(models.Invitation, { foreignKey: 'workspace_id'});
    // Is workspace ke liye kitni join requests pending hain?
    Workspace.hasMany(models.JoinRequest, { foreignKey: 'workspace_id'});

    Workspace.hasMany(models.Project, { foreignKey: 'workspace_id' });
};

module.exports = Workspace;