const authService = require('../services/auth.service');

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signup = async (req, res) => {
    try {
        const user = await authService.registerUser(req.body);
        
        // Password response mein nahi bhejna security ki wajah se
        const { password, ...userWithoutPassword } = user.toJSON();

        res.status(201).json({
            success: true,
            message: 'User registered successfully. Please verify your email.',
            data: userWithoutPassword
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const verifyOTP = async (req, res) => {
    try {
        const { email, code } = req.body;
        const result = await authService.verifyEmail(email, code);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};


const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await authService.loginUser(email, password);
        
        res.status(200).json({
            success: true,
            message: 'Login successful',
            ...result
        });
    } catch (error) {
        res.status(401).json({ success: false, message: error.message });
    }
};

const googleLogin = async (req, res) => {
    try {
        const { idToken } = req.body; // Frontend se aane wala token

        // 1. Google Token ko Verify karein
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, name, sub: googleId } = payload;

        // 2. Service ko call karein user handle karne ke liye
        const result = await authService.handleGoogleUser({
            email,
            full_name: name,
            google_id: googleId
        });

        res.status(200).json({
            success: true,
            message: 'Google Login Successful',
            ...result
        });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Google authentication failed: ' + error.message });
    }
};

const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        console.log("Resend OTP request for:", email); // Debugging line 1

        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        // 1. Naya OTP generate karein aur DB/Cache mein update karein
        // Note: Aapka existing logic jo register par OTP bhejta hai, wahi yahan use hoga
        const result = await authService.generateAndSendOTP(email); 
        console.log("OTP Sent Successfully"); // Debugging line 2

        res.status(200).json({
            success: true,
            message: "A new verification code has been sent to your email."
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updatePassword = async (req, res) => {
    try {
        const { password } = req.body;
        const userId = req.user.id; // Yeh 'protect' middleware se aa raha hai

        if (!password) {
            return res.status(400).json({ 
                success: false, 
                message: "Password is required." 
            });
        }

        // Service call
        await authService.updatePassword(userId, password);

        res.status(200).json({
            success: true,
            message: "Password has been set successfully. Your account is now fully secured."
        });
    } catch (error) {
        // Agar validation error hai to 400, warna 500
        const statusCode = error.message.includes("Password must") ? 400 : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    signup,
    verifyOTP,
    login,
    googleLogin,
    resendOTP,
    updatePassword
};