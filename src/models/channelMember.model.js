const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const ChannelMember = sequelize.define(
  "ChannelMember",
  {
    channel_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: "channels",
        key: "id",
      },
    },
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    role_in_channel: {
      type: DataTypes.ENUM("admin", "member"),
      defaultValue: "member",
    },
    is_muted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    joined_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: true,
    underscored: true,
  },
);

ChannelMember.associate = (models) => {
  ChannelMember.belongsTo(models.User, {
    foreignKey: 'user_id',
  });

  ChannelMember.belongsTo(models.Channel, {
    foreignKey: 'channel_id',
  });
};

module.exports = ChannelMember;
