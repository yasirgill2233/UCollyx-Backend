const { 
  getAllOrganizations, 
  createOrganization, 
  updateStatus,
  getMembersByWorkspaceId
} = require("../services/organization.service");


const getWorkspaceMembersList = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    
    if (!workspaceId) {
      return res.status(400).json({ 
        success: false, 
        message: "Workspace ID is required parameters." 
      });
    }

    // Service call to execute custom specific query
    const members = await getMembersByWorkspaceId(workspaceId);

    console.log("@#$@#$@#@#$@#$@#$@#$#########################",members)

    // Frontend table array configuration mapping loop
    const formattedMembers = members.map(m => {
      const user = m.User || {};
      const joinedDate = new Date(m.joined_at);

      return {
        id: `mem-${user.id || m.user_id}`,
        name: user.full_name || "Unknown Member",
        email: user.email || "N/A",
        
        // Database ENUM capitalization standard handling ('manager', 'dev', 'qa')
        role: (m.role || "DEV").toUpperCase(), 
        
        // workspace_members status attribute ('Active', 'Inactive', 'Suspended')
        status: m.status || "Active", 
        
        time: "Active recently", // UI timeline layout fallback placeholder
        date: joinedDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) + 
              ", " + 
              joinedDate.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
      };
    });

    return res.status(200).json({ 
      success: true, 
      data: formattedMembers 
    });

  } catch (error) {
    console.error("❌ Error matrix inside workspace members controller:", error.message);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// 1. Fetch Organizations and format for React State
const getOrganizations = async (req, res) => {
  try {
    const { search, status } = req.query;
    
    // Direct function call (no class instance reference)
    const workspaces = await getAllOrganizations({ searchTerm: search, status });
    
    // Mapping real DB data to match your React component state keys
    const formattedData = workspaces.map(w => ({
      id: w.TenantDetails ? w.TenantDetails.id : `${w.id}`, // e.g., ORG-402
      db_id: w.id, // Internal react routing aur status update key ke liye
      name: w.name,
      status: w?.status?.charAt(0)?.toUpperCase() + w?.status?.slice(1), // 'active' -> 'Active'
      users: parseInt(w.dataValues.totalUsers) || 0,
      projects: parseInt(w.dataValues.totalProjects) || 0,
      usage: w.TenantDetails ? Math.round((4.2 / w.TenantDetails.usage_limit_gb) * 100) : 0, // Storage percentage
      date: new Date(w.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      email: w.owner_id ? w.User.email : "N/A",
      admin: w.owner_id ? w.User.full_name : "N/A",
      user: w.User
    }));

    return res.status(200).json({ success: true, data: formattedData });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Create Organization Endpoint
const createOrg = async (req, res) => {
  try {
    const { name, adminEmail, plan, status, maxUsers } = req.body;
    
    if (!name || !adminEmail) {
      return res.status(400).json({ success: false, message: "Required fields are missing." });
    }

    const newOrg = await createOrganization({
      name, adminEmail, plan, status, maxUsers
    });

    return res.status(201).json({ success: true, data: newOrg });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Update Workspace Status (Active / Suspended)
const changeStatus = async (req, res) => {
  try {
    const { id } = req.params; // db_id expected from endpoint params
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required" });
    }

    await updateStatus(id, status);
    return res.status(200).json({ success: true, message: `Status updated to ${status}` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Exporting direct functions object instead of class instance
module.exports = {
  getOrganizations,
  createOrg,
  changeStatus,
  getWorkspaceMembersList
};