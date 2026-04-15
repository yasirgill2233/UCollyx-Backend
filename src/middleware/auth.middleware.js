// const jwt = require('jsonwebtoken');
// const { User } = require('../models');

// const protect = async (req, res, next) => {
//     let token;

//     // 1. Check karein ke header mein Authorization token hai ya nahi
//     if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
//         try {
//             // Token ko extract karein (Bearer <token>)
//             token = req.headers.authorization.split(' ')[1];

//             // 2. Token ko decode/verify karein
//             const decoded = jwt.verify(token, process.env.JWT_SECRET);

//             // 3. User ko database se dhoondein aur request object mein save kar dein
//             // Password ko exclude kar dein safety ke liye
//             req.user = await User.findByPk(decoded.id, {
//                 attributes: { exclude: ['password'] }
//             });

//             if (!req.user) {
//                 return res.status(401).json({ success: false, message: 'User not found' });
//             }

//             next(); // Agle function (Controller) par jao
//         } catch (error) {
//             console.error(error);
//             res.status(401).json({ success: false, message: 'Not authorized, token failed' });
//         }
//     }

//     if (!token) {
//         res.status(401).json({ success: false, message: 'Not authorized, no token' });
//     }
// };

// module.exports = { protect };


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