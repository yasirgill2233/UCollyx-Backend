// src/models/index.js
const { sequelize } = require('../config/db');
const User = require('./user.model.js');
const VerificationCode = require('./verification.model.js')
const Workspace = require('./workspace.model')
const Tenant = require('./tenant.model')
const WorkspaceMember = require('./workspaceMember.model')
const JoinRequest = require('./joinRequest.model')
const Invitation = require('./invitation.model')
const Project = require('./project.model.js')
const Sprint = require('./sprint.model')
const ProjectMember = require('./projectMember.model')  
const ActivityLog = require('./activityLog.model')
const SystemAlert = require('./systemAlert.model.js')

const Channel = require('./channel.model.js')
const ChannelMember = require('./channelMember.model.js')
const Message = require('./message.model.js')
const Notification = require('./notification.model.js')

const db = {};

db.Sequelize = require('sequelize');
db.sequelize = sequelize;

db.User = User;
db.VerificationCode = VerificationCode;
db.Workspace = Workspace;
db.Tenant = Tenant;
db.WorkspaceMember = WorkspaceMember;
db.JoinRequest = JoinRequest;
db.Invitation = Invitation;

db.Project = Project;
db.ProjectMember = ProjectMember;
db.Sprint = Sprint;

db.ActivityLog = ActivityLog
db.SystemAlert = SystemAlert

db.Channel = Channel;
db.ChannelMember = ChannelMember;
db.Message = Message;
db.Notification = Notification;



Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

module.exports = db;