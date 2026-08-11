const express = require('express');
const { Permission, WorkspacePermission } = require('../models');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const permissions = await Permission.findAll();
    res.status(200).json({ success: true, data: permissions });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.put('/toggle/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;

    const permission = await Permission.findByPk(id);
    if (!permission) {
      return res.status(404).json({ success: false, message: "Permission record not found" });
    }

    // Database structure key update status save karo
    permission.enabled = enabled;
    await permission.save();

    res.status(200).json({ success: true, message: "State synchronized successfully", data: permission });
  } catch (error) {
    console.error("Toggle update error:", error);
    res.status(500).json({ success: false, message: "Database update failure" });
  }
});


router.get('/workspace/:workspaceSlug', async (req, res) => {
  try {
    const { workspaceSlug } = req.params;

    const masterPermissions = await Permission.findAll();

    const workspaceOverrides = await WorkspacePermission.findAll({
      where: { workspace_slug: workspaceSlug }
    });

    const customizedPermissions = masterPermissions.map(master => {
      const override = workspaceOverrides.find(o => o.permissionId === master.id);
      console.log(`Master Permission: ${master.label}, Override Found: ${override}`);
      return {
        id: master.id,
        role: master.role,
        label: master.label,
        route: master.route,
        enabled: override ? override.enabled : master.enabled 
      };
    });

    console.log(`Fetched permissions for workspace: ${masterPermissions}`, workspaceOverrides);

    res.status(200).json({ success: true, data: customizedPermissions });
  } catch (error) {
    console.error("Workspace fetch permission issue:", error);
    res.status(500).json({ success: false, message: "Server calculation failure" });
  }
});

router.put('/workspace/:workspaceSlug/:permissionId', async (req, res) => {
  try {
    const { workspaceSlug, permissionId } = req.params;
    const { enabled } = req.body;

    let record = await WorkspacePermission.findOne({
      where: { workspace_slug: workspaceSlug, permission_id: permissionId }
    });

    if (record) {
      record.enabled = enabled;
      await record.save();
    } else {
      record = await WorkspacePermission.create({
        workspaceSlug,
        permissionId,
        enabled
      });
    }

    res.status(200).json({ success: true, message: "Workspace sync parameters saved", data: record });
  } catch (error) {
    console.error("Workspace toggle state saving error:", error);
    res.status(500).json({ success: false, message: "Database patch exception" });
  }
});

module.exports = router;