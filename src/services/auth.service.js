const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  User,
  VerificationCode,
  WorkspaceMember,
  Workspace,
  JoinRequest,
} = require("../models");
const sendEmail = require("../utils/email");

const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const registerUser = async (userData) => {
  const { email, password, full_name } = userData;

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = await User.create({
    email,
    full_name,
    password: hashedPassword,
    status: "pending",
  });

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 40 * 1000);

  await VerificationCode.create({
    user_id: newUser.id,
    code: otpCode,
    type: "email_verify",
    expires_at: expiresAt,
  });

  try {
    await sendEmail({
      email: newUser.email,
      subject: "Verify your UCollyx Account",
      message: "Your verification code is:",
      otp: otpCode,
    });
    console.log(`Real Email sent to ${newUser.email}`);
  } catch (err) {
    console.error("Email failed to send:", err.message);
    throw new Error(
      "Email could not be sent. Please check your email settings.",
    );
  }

  return newUser;
};

const verifyEmail = async (email, code) => {
  const user = await User.findOne({ where: { email } });
  if (!user) throw new Error("User not found");

  const record = await VerificationCode.findOne({
    where: {
      user_id: user.id,
      code,
      is_used: false,
      type: "email_verify",
    },
  });

  if (!record) throw new Error("Invalid or expired OTP");

  if (new Date() > record.expires_at) {
    throw new Error("OTP has expired");
  }

  user.is_verified = true;
  user.status = "active";
  await user.save();

  record.is_used = true;
  await record.save();

  return { message: "Email verified successfully!" };
};

const loginUser = async (email, password) => {
  if (
    email === process.env.SUPER_ADMIN_EMAIL &&
    password === process.env.SUPER_ADMIN_PASSWORD
  ) {
    return {
      user: {
        id: 0,
        name: "System Overlord",
        email: email,
        role: "super_admin",
        workspaces: [],
      },
      token: jwt.sign(
        { id: 0, email, role: "super_admin" },
        process.env.JWT_SECRET,
        { expiresIn: "24h" },
      ),
    };
  }

  const user = await User.findOne({
    where: { email },
    include: [
      {
        model: Workspace,
        through: { attributes: ["role"] },
        attributes: ["id", "name"],
      },
    ],
  });
  
  if (!user) throw new Error("Invalid email or password");

  if(user?.status !== 'active'){
    throw new Error("Your status is not active for joining")
  }

  const userRequest = await JoinRequest.findOne({
    where: { user_id: user.id },
    order: [["created_at", "DESC"]],
  });


  if (!user.is_verified) {
    throw new Error("Please verify your email first");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid email or password");

  await user.update({ last_login: new Date() });

  let finalRole = null;
  let workspaceId = null;

  if (user.Workspaces && user.Workspaces.length > 0) {
    finalRole = user.Workspaces[0].WorkspaceMember.role;
    workspaceId = user.Workspaces[0].id;
  } else {
    finalRole = user.role;
  }

  const { password: _, Workspaces: __, ...userStats } = user.toJSON();

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: finalRole,
      workspace_id: workspaceId,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN },
  );

  return {
    user: {
      ...userStats,
      role: finalRole,
      workspace_id: workspaceId,
      requestStatus: userRequest ? userRequest.status : "no_request",
    },
    token,
  };
};

const handleGoogleUser = async (googleData) => {
  const { email, full_name } = googleData;
  let user = await User.findOne({ where: { email } });
  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    user = await User.create({
      email,
      full_name,
      is_verified: true,
      status: "active",
      password: "SOCIAL_LOGIN_USER_PENDING",
    });
  } else if (user.password === "SOCIAL_LOGIN_USER_PENDING") {

    isNewUser = true;
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
  const { password: _, ...userWithoutPassword } = user.toJSON();

  return { user: userWithoutPassword, token, isNewUser };
};

const generateAndSendOTP = async (email) => {
  const user = await User.findOne({ where: { email } });
  console.log(user);
  if (!user) {
    throw new Error("User with this email does not exist.");
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  const expiresAt = new Date(Date.now() + 10 * 60000);

  await VerificationCode.update(
    { code: otpCode, expires_at: expiresAt },
    { where: { user_id: user.id } },
  );

  const emailData = {
    email: email,
    subject: "Verify your UCollyx Account",
    message: "Your verification code is:",
    otp: otpCode,
  };

  try {
    await sendEmail(emailData);
    console.log(`Real Email sent to ${email}`);
  } catch (err) {
    console.error("Email failed to send:", err.message);
    throw new Error(
      "Email could not be sent. Please check your email settings.",
    );
  }
};

const updatePassword = async (userId, newPassword) => {
  if (!newPassword || newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }

  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  const [updatedRows] = await User.update(
    { password: hashedPassword },
    { where: { id: userId } },
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
  updatePassword,
};
