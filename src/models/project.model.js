const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Project = sequelize.define('Project', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    workspace_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'workspaces', key: 'id' }
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    code: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false
    },
    slug: {
        type: DataTypes.STRING(255),
        unique: true,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('Active', 'On Hold', 'Archived', 'PAUSED'),
        defaultValue: 'Active'
      },
    progress: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    manager_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' }
    },
    current_sprint: {
        type: DataTypes.STRING(100),
        allowNull: true
    }
}, {
    timestamps: true,
    underscored: true
});

Project.associate = (models) => {
    // Project kis workspace ka hissa hai
    Project.belongsTo(models.Workspace, { foreignKey: 'workspace_id' });
    
    // Project ka manager kon hai (User table se)
    Project.belongsTo(models.User, { foreignKey: 'manager_id', as: 'manager' });
    
    // Project members (Many-to-Many via ProjectMember)
    Project.belongsToMany(models.User, { 
        through: models.ProjectMember, 
        foreignKey: 'project_id', 
        otherKey: 'user_id',
        as: 'members'
    });

    // Project ki sprints
    Project.hasMany(models.Sprint, { foreignKey: 'project_id' });
};

module.exports = Project;