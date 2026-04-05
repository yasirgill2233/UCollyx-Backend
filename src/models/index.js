// src/models/index.js
const { sequelize } = require('../config/db');
const User = require('./user.model.js');
const VerificationCode = require('./verification.model.js')
const Workspace = require('./workspace.model')
const Tenant = require('./tenant.model')
const WorkspaceMember = require('./workspaceMember.model')
const JoinRequest = require('./joinRequest.model')
const Invitation = require('./invitation.model')

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


Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

module.exports = db;