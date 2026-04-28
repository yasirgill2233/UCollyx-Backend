const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
    let token;

    // 1. Check karein ke header mein Authorization token hai
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            // 2. Token ko verify karein
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            /* 3. CRITICAL CHANGE: 
               Database call (User.findByPk) karne ki bajaye direct 'decoded' data use karein.
               Kyunki login ke waqt humne token mein workspace_id daal dia tha.
            */
            req.user = decoded; 

            // Debugging ke liye (Baad mein hata sakte hain)
            // console.log("User authorized with Workspace ID:", req.user.workspace_id);

            next(); 
        } catch (error) {
            console.error("Auth Middleware Error:", error);
            return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        }
    } else {
        // Agar token header mein nahi hai
        return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
};

module.exports = { protect };