const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Subtask = sequelize.define('Subtask', {
    id: {
        type: DataTypes.STRING(50),
        primaryKey: true,
        autoIncrement: true
    },
    task_id: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    is_done: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    assignee_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    timestamps: true,
    underscored: true
});

Subtask.associate = (models) => {
    Subtask.belongsTo(models.Task, { foreignKey: 'task_id' });
    Subtask.belongsTo(models.User, { as: 'Assignee', foreignKey: 'assignee_id' });
};

module.exports = Subtask;