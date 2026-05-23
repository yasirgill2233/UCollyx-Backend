const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Epic = sequelize.define('Epic', {
    id: {
        type: DataTypes.STRING(50),
        primaryKey: true,
        references: { model: 'tasks', key: 'id' }
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    color_code: {
        type: DataTypes.STRING(50),
        defaultValue: 'bg-indigo-600'
    },
    project_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    timestamps: false,
    underscored: true
});

Epic.associate = (models) => {
    Epic.belongsTo(models.Task, { foreignKey: 'id' });
    Epic.belongsTo(models.Project, { foreignKey: 'project_id' });
};

module.exports = Epic;