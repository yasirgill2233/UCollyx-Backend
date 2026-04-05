const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const VerificationCode = sequelize.define('VerificationCode', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users', // Table name (snake_case)
            key: 'id'
        },
        onDelete: 'CASCADE' // Agar user delete ho to codes bhi khud hi delete ho jayein
    },
    code: {
        type: DataTypes.STRING(6),
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('email_verify', 'password_reset'),
        defaultValue: 'email_verify'
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: false
    },
    is_used: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    // tableName: 'verification_codes',
    timestamps: true,
    underscored: true
});

VerificationCode.associate = (models) => {
    VerificationCode.belongsTo(models.User, { foreignKey: 'user_id'});
};

module.exports = VerificationCode;