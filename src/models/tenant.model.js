const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Tenant = sequelize.define('Tenant', {
    id: {
        type: DataTypes.STRING(50),
        primaryKey: true
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
    plan_type: {
        type: DataTypes.ENUM('free', 'pro', 'enterprise'),
        defaultValue: 'free'
    },
    max_users: {
        type: DataTypes.INTEGER,
        defaultValue: 10
    },
    usage_limit_gb: {
        type: DataTypes.INTEGER,
        defaultValue: 5
    }
}, {
    // tableName: 'tenants',
    timestamps: true,
    underscored: true
});

Tenant.associate = (models) => {
    Tenant.belongsTo(models.Workspace, { foreignKey: 'workspace_id' });
};

module.exports = Tenant;