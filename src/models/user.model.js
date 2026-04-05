const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    full_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("super_admin", "org_admin", "manager", "dev", "qa"),
      defaultValue: "dev",
    },
    avatar_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        "active",
        "suspended",
        "pending",
        "Invited",
        "Disabled",
      ),
      defaultValue: "active",
    },
    registration_step: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    start_date: {
      type: DataTypes.DATEONLY, // Sirf Date ke liye (No time)
      allowNull: true,
    },
  },{
    // tableName: 'users', // Table ka naam database mein 'users' rakhega
    timestamps: true, // createdAt aur updatedAt khud handle karega
    underscored: true, // createdAt ko created_at bana dega (snake_case)
  },
);

User.associate = (models) => {
  User.hasMany(models.VerificationCode, { foreignKey: "user_id" });
  User.hasMany(models.Workspace, { foreignKey: "owner_id" });
  User.belongsToMany(models.Workspace, {
    through: models.WorkspaceMember,
    foreignKey: "user_id",
    otherKey: "workspace_id",
  });
  // User kitne invites bhej chuka hai?
  User.hasMany(models.Invitation, { foreignKey: "invited_by" });
  // User ki apni bheji hui join requests
  User.hasMany(models.JoinRequest, { foreignKey: "user_id" });
};

module.exports = User;
