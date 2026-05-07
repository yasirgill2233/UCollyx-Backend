const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Message = sequelize.define(
  "Message",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    channel_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "channels",
        key: "id",
      },
    },
    receiver_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    },
    task_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
      // Agar tasks model generate ho jaye tab FK enforce kar sakte hain
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    attachments: {
      type: DataTypes.JSON, // Sab se best tareeqa multiple files ke liye
      allowNull: true,
      defaultValue: [], // Default empty array rakhein
    },
    sent_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: true,
    underscored: true,
  },
);

Message.associate = (models) => {
  Message.belongsTo(models.User, {
    foreignKey: "sender_id",
    as: 'Sender'
  });

  Message.belongsTo(models.User, {
    foreignKey: "receiver_id",
    as: 'Receiver'
  });

  Message.belongsTo(models.Channel, {
    foreignKey: "channel_id",
  });
};

module.exports = Message;
