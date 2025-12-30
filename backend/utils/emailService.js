import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verify transporter connection
transporter.verify((error, success) => {
  if (error) {
    console.error('Email service configuration error:', error.message);
  } else {
    console.log('✅ Email service is ready');
  }
});

const emailTemplates = {
  teamInvitation: (invitationUrl, teamName, inviterName, inviteeFirstName) => {
    return {
      subject: `Invitation à rejoindre l'équipe ${teamName} - Focus Forge`,
      html: `
        <!DOCTYPE html>
        <html dir="ltr" lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width">
            <style>
              body {
                font-family: Sora, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                line-height: 1.6;
                color: #333;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 8px 8px 0 0;
                text-align: center;
              }
              .header h1 {
                margin: 0;
                font-size: 28px;
              }
              .content {
                background: #f9f9f9;
                padding: 30px;
                border-radius: 0 0 8px 8px;
                border: 1px solid #e0e0e0;
              }
              .greeting {
                font-size: 16px;
                margin-bottom: 20px;
              }
              .message {
                margin-bottom: 30px;
                color: #555;
              }
              .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 14px 32px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                margin-bottom: 30px;
              }
              .cta-button:hover {
                opacity: 0.9;
              }
              .link-section {
                background: white;
                padding: 20px;
                border-radius: 6px;
                margin-bottom: 20px;
                border: 1px solid #e0e0e0;
              }
              .link-label {
                font-size: 12px;
                color: #999;
                text-transform: uppercase;
                margin-bottom: 8px;
              }
              .link-text {
                word-break: break-all;
                color: #667eea;
                font-size: 14px;
              }
              .footer {
                font-size: 12px;
                color: #999;
                text-align: center;
                margin-top: 30px;
                border-top: 1px solid #e0e0e0;
                padding-top: 20px;
              }
              .info-box {
                background: #e8f4f8;
                border-left: 4px solid #667eea;
                padding: 15px;
                margin-bottom: 20px;
                border-radius: 4px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎯 Focus Forge</h1>
              </div>
              <div class="content">
                <div class="greeting">
                  Bonjour ${inviteeFirstName || 'there'},
                </div>

                <div class="message">
                  <p><strong>${inviterName}</strong> vous invite à rejoindre l'équipe <strong>${teamName}</strong> sur Focus Forge.</p>
                </div>

                <div class="info-box">
                  <p><strong>À propos de Focus Forge :</strong><br>
                  Focus Forge est une plateforme collaborative de gestion de projets et de tickets, conçue pour améliorer la productivité de votre équipe.</p>
                </div>

                <div style="text-align: center;">
                  <a href="${invitationUrl}" class="cta-button">Accepter l'invitation</a>
                </div>

                <div class="link-section">
                  <div class="link-label">Si le bouton ne fonctionne pas, copiez ce lien :</div>
                  <div class="link-text">${invitationUrl}</div>
                </div>

                <div class="message">
                  <p><strong>Important :</strong></p>
                  <ul>
                    <li><strong>Si vous avez déjà un compte :</strong> Connectez-vous sur le lien d'acceptation pour accepter directement</li>
                    <li><strong>Si vous n'avez pas de compte :</strong> Vous devrez créer un compte lors de l'acceptation</li>
                  </ul>
                </div>

                <div class="message">
                  <p>Une fois acceptée, vous pourrez :</p>
                  <ul>
                    <li>Collaborer avec votre équipe</li>
                    <li>Gérer des tickets et des projets</li>
                    <li>Suivre la progression des tâches</li>
                    <li>Communiquer avec vos collègues</li>
                  </ul>
                </div>

                <div class="footer">
                  <p>Cet email a été envoyé à votre adresse associée à votre invitation. Si ce n'était pas vous, vous pouvez ignorer cet email.</p>
                  <p>&copy; 2024 Focus Forge. Tous droits réservés.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    };
  },

  invitationAccepted: (inviteeFirstName, inviteeName, teamName) => {
    return {
      subject: `${inviteFirstName} a accepté votre invitation - Focus Forge`,
      html: `
        <!DOCTYPE html>
        <html dir="ltr" lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width">
            <style>
              body {
                font-family: Sora, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                line-height: 1.6;
                color: #333;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 8px 8px 0 0;
                text-align: center;
              }
              .header h1 {
                margin: 0;
                font-size: 28px;
              }
              .content {
                background: #f9f9f9;
                padding: 30px;
                border-radius: 0 0 8px 8px;
                border: 1px solid #e0e0e0;
              }
              .success-box {
                background: #e8f5e9;
                border-left: 4px solid #4caf50;
                padding: 20px;
                margin-bottom: 20px;
                border-radius: 4px;
                text-align: center;
              }
              .footer {
                font-size: 12px;
                color: #999;
                text-align: center;
                margin-top: 30px;
                border-top: 1px solid #e0e0e0;
                padding-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Focus Forge</h1>
              </div>
              <div class="content">
                <div class="success-box">
                  <h2 style="margin: 0; color: #4caf50;">Invitation acceptée!</h2>
                  <p style="margin: 10px 0 0 0;">${inviteeFirstName} a accepté votre invitation pour rejoindre l'équipe <strong>${teamName}</strong>.</p>
                </div>

                <p>Vous pouvez maintenant commencer à collaborer avec ${inviteeFirstName} sur Focus Forge.</p>

                <div class="footer">
                  <p>&copy; 2024 Focus Forge. Tous droits réservés.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    };
  },
};

export const sendInvitationEmail = async (email, invitationUrl, teamName, inviterName, inviteeFirstName) => {
  try {
    const template = emailTemplates.teamInvitation(invitationUrl, teamName, inviterName, inviteeFirstName);

    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: email,
      subject: template.subject,
      html: template.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Invitation email sent to ${email}:`, info.response);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending invitation email:', error);
    return { success: false, error: error.message };
  }
};

export const sendInvitationAcceptedEmail = async (email, inviteeFirstName, inviteeName, teamName) => {
  try {
    const template = emailTemplates.invitationAccepted(inviteeFirstName, inviteeName, teamName);

    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: email,
      subject: template.subject,
      html: template.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Acceptance email sent to ${email}:`, info.response);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending acceptance email:', error);
    return { success: false, error: error.message };
  }
};
