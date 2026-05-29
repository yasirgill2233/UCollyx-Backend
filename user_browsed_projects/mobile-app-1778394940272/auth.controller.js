const authService = require('../services/auth.service');

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signup = async (req, res) => {
    try {
        const user = await authService.registerUser(req.body);
        
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
        const { idToken } = req.body;

        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, name, sub: googleId } = payload;

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

        console.log("Resend OTP request for:", email);

        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        const result = await authService.generateAndSendOTP(email); 
        console.log("OTP Sent Successfully");
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
        const userId = req.user.id;

        if (!password) {
            return res.status(400).json({ 
                success: false, 
                message: "Password is required." 
            });
        }

        await authService.updatePassword(userId, password);

        res.status(200).json({
            success: true,
            message: "Password has been changed successfully"
        });
    } catch (error) {
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