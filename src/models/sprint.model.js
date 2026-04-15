const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Sprint = sequelize.define('Sprint', {
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
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    start_date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    end_date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('active', 'completed'),
        defaultValue: 'active'
    }
}, {
    timestamps: true,
    underscored: true
});

Sprint.associate = (models) => {
    Sprint.belongsTo(models.Project, { foreignKey: 'project_id' });
};

module.exports = Sprint;