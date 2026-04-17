const transporter = require("../config/mailer");

const sendInviteEmail = async (
  toEmail,
  workspaceName,
  inviterName,
  role,
  inviteCode,
) => {
  //   const transporter = nodemailer.createTransport({
  //     service: "gmail",
  //     auth: {
  //       user: process.env.EMAIL_USER,
  //       pass: process.env.EMAIL_PASS,
  //     },
  //   });

  // inviteEmail.js ke andar link generate karne ka sahi tareeqa:
  const inviteLink = `${process.env.FRONTEND_URL}/join-space?token=${inviteCode}`;

  const mailOptions = {
    from: `"UCollyx" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `You've been invited to join ${workspaceName} on UCollyx`,
    html: `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 500px; margin: auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); padding: 40px 20px; text-align: center; color: white;">
                    <div style="background: rgba(255,255,255,0.2); width: 50px; height: 50px; border-radius: 12px; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                        <span style="font-size: 24px;">✉️</span>
                    </div>
                    <h1 style="margin: 0; font-size: 24px; font-weight: bold;">You've been invited!</h1>
                    <p style="margin: 10px 0 0; opacity: 0.9;">Join your team and start collaborating</p>
                </div>
                
                <div style="padding: 30px; background: white;">
                    <div style="background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
                        <div style="margin-bottom: 15px;">
                            <small style="color: #94a3b8; font-weight: bold; text-transform: uppercase; font-size: 10px;">Organisation</small>
                            <div style="font-weight: bold; color: #1e293b; font-size: 16px;">🏢 ${workspaceName}</div>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <small style="color: #94a3b8; font-weight: bold; text-transform: uppercase; font-size: 10px;">Your Role</small>
                            <div style="display: inline-block; background: #eef2ff; color: #6366f1; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-top: 5px;">
                                💻 ${role}
                            </div>
                        </div>
                        <div>
                            <small style="color: #94a3b8; font-weight: bold; text-transform: uppercase; font-size: 10px;">Invited By</small>
                            <div style="color: #1e293b; font-weight: bold;">👩‍💼 ${inviterName} <span style="color: #94a3b8; font-weight: normal; font-size: 12px;">Organisation Admin</span></div>
                        </div>
                    </div>

                    <a href="${inviteLink}" style="display: block; background: #6366f1; color: white; text-align: center; padding: 15px; border-radius: 10px; text-decoration: none; font-weight: bold; box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2);">
                        Accept Invitation & Join Workspace
                    </a>
                    
                    <div style="text-align: center; margin-top: 20px;">
                        <a href="#" style="color: #94a3b8; font-size: 12px; text-decoration: none;">Decline Invitation</a>
                    </div>
                </div>
            </div>
        `,
  };

  return await transporter.sendMail(mailOptions);
};

module.exports = sendInviteEmail;
