const express = require('express');
const router = express.Router();
const workspaceController = require('../controllers/workspace.controller');
const { protect } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload');

router.get('/my-workspaces', protect, workspaceController.getMyWorkspaces);
router.get('/workspaces', protect, workspaceController.getWorkspaces);
router.post('/create', protect, upload.single('logo'), workspaceController.create);
router.post('/join', protect, workspaceController.joinWorkspace);
router.post('/invite-members', workspaceController.inviteMembers);
router.post('/accept-invite', workspaceController.acceptInvite);
router.get('/check-invite/:token', workspaceController.checkInvitation);


module.exports = router;