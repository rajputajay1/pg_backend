import nodemailer from 'nodemailer';

/**
 * Generate a random password
 * @param {number} length - Password length
 * @returns {string} Generated password
 */
export const generateRandomPassword = (length = 12) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

/**
 * Generate website URL from owner name
 * @param {string} name - Owner name
 * @returns {string} Generated website URL
 */
export const generateWebsiteUrl = (name) => {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  const ownerFrontendUrl = process.env.OWNER_FRONTEND_URL || 'http://localhost:5174';
  return `${ownerFrontendUrl}`;
};

/**
 * Create email transporter
 * @returns {object} Nodemailer transporter
 */
const createTransporter = () => {
  // Check if SMTP credentials are available
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  
  // Fallback to Gmail if configured
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  
  return null;
};

/**
 * Send welcome email with credentials
 * @param {object} data - Email data
 * @returns {Promise<object>} Send result
 */
export const sendWelcomeEmail = async (data) => {
  const { to, name, email, password, websiteUrl, planName, planPrice } = data;
  
  const transporter = createTransporter();
  
  if (!transporter) {
    console.log('Email service not configured. Credentials should be sent via frontend.');
    return {
      success: false,
      message: 'Email service not configured',
      method: 'none',
    };
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.GMAIL_USER || 'noreply@mansionmuse.com',
    to,
    subject: `Welcome to Mansion Muse - Your ${planName} Plan is Active!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
          .credential-item { margin: 15px 0; }
          .credential-label { font-weight: bold; color: #667eea; }
          .credential-value { font-family: monospace; background: #f0f0f0; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 5px; }
          .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to Mansion Muse!</h1>
            <p>Your ${planName} Plan is Now Active</p>
          </div>
          <div class="content">
            <p>Dear ${name},</p>
            <p>Thank you for choosing Mansion Muse! Your payment of <strong>₹${planPrice}</strong> has been successfully processed.</p>
            
            <div class="credentials">
              <h3>Your Login Credentials</h3>
              <div class="credential-item">
                <div class="credential-label">📧 Email:</div>
                <div class="credential-value">${email}</div>
              </div>
              <div class="credential-item">
                <div class="credential-label">🔒 Password:</div>
                <div class="credential-value">${password}</div>
              </div>
              <div class="credential-item">
                <div class="credential-label">🌐 Login URL:</div>
                <div class="credential-value">${websiteUrl}</div>
              </div>
            </div>

            <div class="warning">
              <strong>⚠️ Important:</strong> Please save these credentials securely and change your password after your first login.
            </div>

            <center>
              <a href="${websiteUrl}" class="button">Access Your Dashboard</a>
            </center>

            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            
            <p>Best regards,<br>The Mansion Muse Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; ${new Date().getFullYear()} Mansion Muse. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return {
      success: true,
      message: 'Welcome email sent successfully',
      method: 'smtp',
    };
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return {
      success: false,
      message: error.message,
      method: 'smtp',
    };
  }
};

export default {
  generateRandomPassword,
  generateWebsiteUrl,
  sendWelcomeEmail,
};
