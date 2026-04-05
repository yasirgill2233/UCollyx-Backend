const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, VerificationCode } = require('../models');
const sendEmail = require('../utils/email'); // Import utility

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const registerUser = async (userData) => {
    const { email, password, full_name } = userData;

    // 1. Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
        throw new Error('User with this email already exists');
    }

    // 2. Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create User
    const newUser = await User.create({
        email,
        full_name,
        password: hashedPassword,
        status: 'pending' // Jab tak email verify na ho
    });

    // --- OTP Generation ---
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    await VerificationCode.create({
        user_id: newUser.id,
        code: otpCode,
        type: 'email_verify',
        expires_at: expiresAt
    });

    try {
        await sendEmail({
            email: newUser.email,
            // email: 'sabaamina001@gmail.com',
            subject: 'Verify your UCollyx Account',
            message: 'Your verification code is:',
            otp: otpCode
        });
        console.log(`Real Email sent to ${newUser.email}`);
    } catch (err) {
        console.error('Email failed to send:', err.message);
        // Error handling: Agar email na jaye to user ko batayein
        throw new Error('Email could not be sent. Please check your email settings.');
    }

    return newUser;
};

const verifyEmail = async (email, code) => {
    // 1. User dhoondein
    const user = await User.findOne({ where: { email } });
    if (!user) throw new Error('User not found');

    // 2. Code check karein
    const record = await VerificationCode.findOne({
        where: { 
            user_id: user.id, 
            code, 
            is_used: false,
            type: 'email_verify'
        }
    });

    if (!record) throw new Error('Invalid or expired OTP');

    // 3. Expiry check karein
    if (new Date() > record.expires_at) {
        throw new Error('OTP has expired');
    }

    // 4. User ko verify karein aur code ko 'used' mark karein
    user.is_verified = true;
    user.status = 'active';
    await user.save();

    record.is_used = true;
    await record.save();

    return { message: 'Email verified successfully!' };
};

const loginUser = async (email, password) => {
    // 1. User dhoondein
    const user = await User.findOne({ where: { email } });
    // const workspaces = await WorkspaceMember.findAll({ where: { user_id: user.id } });

    if (!user) throw new Error('Invalid email or password');

    // 2. Check agar user verified hai
    if (!user.is_verified) {
        throw new Error('Please verify your email first');
    }

    // 3. Password check karein
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Invalid email or password');

    // 4. Token generate karein
    const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Password nikaal kar user data return karein
    const { password: _, ...userStats } = user.toJSON();
    return { user: userStats, token };
};

const handleGoogleUser = async (googleData) => {
    const { email, full_name } = googleData;
    let user = await User.findOne({ where: { email } });
    let isNewUser = false; // Flag for frontend

    if (!user) {
        isNewUser = true;
        user = await User.create({
            email,
            full_name,
            is_verified: true,
            status: 'active',
            password: 'SOCIAL_LOGIN_USER_PENDING' // Indication ke password set nahi hua
        });
    } else if (user.password === 'SOCIAL_LOGIN_USER_PENDING') {
        // Agar user pehle aaya tha lekin password set nahi kiya tha
        isNewUser = true;
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    const { password: _, ...userWithoutPassword } = user.toJSON();

    return { user: userWithoutPassword, token, isNewUser }; 
};

const generateAndSendOTP = async (email) => {
    // 1. Check karein ke user exists karta hai
    const user = await User.findOne({ where: { email } });
    console.log(user)
    if (!user) {
        throw new Error("User with this email does not exist.");
    }

    // 2. Naya 6-digit random code generate karein
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // OTP ki expiry set karein (maslan 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60000);

    // 3. Database mein OTP update ya create karein
    // Agar pehle se koi OTP hai us user ka, to usay overwrite karein
    await VerificationCode.update(
    { code: otpCode, expires_at: expiresAt },
    { where: { user_id: user.id } }
);

    // 4. Email bhejein
    const emailData = {
        email: email,
        subject: 'Verify your UCollyx Account',
        message: 'Your verification code is:',
        otp: otpCode
    };

    try {
        await sendEmail(emailData);
        console.log(`Real Email sent to ${email}`);
    } catch (err) {
        console.error('Email failed to send:', err.message);
        // Error handling: Agar email na jaye to user ko batayein
        throw new Error('Email could not be sent. Please check your email settings.');
    }
    
};

const updatePassword = async (userId, newPassword) => {
    // 1. Password ki strength check karein (Optional but recommended)
    if (!newPassword || newPassword.length < 8) {
        throw new Error("Password must be at least 8 characters long.");
    }

    // 2. Hash the password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 3. Update in Database
    const [updatedRows] = await User.update(
        { password: hashedPassword },
        { where: { id: userId } }
    );

    if (updatedRows === 0) {
        throw new Error("User not found or password update failed.");
    }

    return { success: true };
};

module.exports = {
    registerUser,
    verifyEmail,
    loginUser,
    handleGoogleUser,
    generateAndSendOTP,
    updatePassword
};