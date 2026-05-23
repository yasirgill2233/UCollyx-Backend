const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TaskComment = sequelize.define('TaskComment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    task_id: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    timestamps: true,
    underscored: true
});

TaskComment.associate = (models) => {
    TaskComment.belongsTo(models.Task, { foreignKey: 'task_id' });
    TaskComment.belongsTo(models.User, { foreignKey: 'user_id' });
};

module.exports = TaskComment;