const transporter = require('../config/mailer');

const sendEmail = async (options) => {
    const mailOptions = {
        from: `UCollyx Support <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: `
            <div style="font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px;">
                <h2 style="color: #4A90E2;">UCollyx Verification</h2>
                <p>Hello,</p>
                <p>${options.message}</p>
                <div style="background: #f4f4f4; padding: 10px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
                    ${options.otp}
                </div>
                <p>This code will expire in 10 minutes.</p>
            </div>
        `
    };
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;