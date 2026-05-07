const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Channel = sequelize.define(
  "Channel",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM("public", "private"),
      defaultValue: "public",
    },
    is_private: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
  },
  {
    timestamps: true,
    underscored: true,
  },
);

Channel.associate = (models) => {
  Channel.belongsTo(models.User, {
    foreignKey: 'created_by',
  });

  Channel.belongsToMany(models.User, {
    through: models.ChannelMember,
    foreignKey: 'channel_id',
    otherKey: 'user_id',
  });

  Channel.hasMany(models.ChannelMember, {
    foreignKey: 'channel_id',
  });

  Channel.hasMany(models.Message, {
    foreignKey: 'channel_id',
  });
};

module.exports = Channel;
