const transporter = require('../config/mailer');

/**
 * Send Workspace Join Approval Email
 */
const sendApprovalEmail = async (options) => {
    const mailOptions = {
        from: `UCollyx Support <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: 'Workspace Request Approved!',
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 550px; margin: auto; border: 1px solid #eee; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                <div style="background: #4f46e5; padding: 30px; text-align: center;">
                    <h2 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 1px;">Access Granted</h2>
                </div>
                
                <div style="padding: 40px 30px; background: #ffffff;">
                    <p style="font-size: 16px; color: #334155;">Hello <b>${options.full_name}</b>,</p>
                    
                    <p style="font-size: 14px; color: #64748b; line-height: 1.6;">
                        Great news! Your request to join the workspace <b>${options.workspace_name}</b> has been approved. 
                        You have been assigned the role of <b>${options.role}</b>.
                    </p>
                    
                    <div style="margin: 35px 0; text-align: center;">
                        <a href="${process.env.FRONTEND_URL}/" 
                           style="background: #4f46e5; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 14px; display: inline-block;">
                           Login to Dashboard
                        </a>
                    </div>
                    
                    <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 30px; border-top: 1px solid #f1f5f9; pt-20px;">
                        Welcome to the team! We're excited to have you onboard.
                    </p>
                </div>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
};

module.exports = { sendApprovalEmail };