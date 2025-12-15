import nodemailerPackage from 'nodemailer';
const nodemailer = nodemailerPackage.default || nodemailerPackage;

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
  
  const ownerFrontendUrl = process.env.OWNER_FRONTEND_URL || 'http://localhost:8081';
  return `${ownerFrontendUrl}`;
};

/**
 * Create email transporter
 * @returns {object} Nodemailer transporter
 */
const createTransporter = () => {
  // Check if SMTP credentials are available
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
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
    return nodemailer.createTransport({
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
  
  console.log('📧 ========== EMAIL SENDING ATTEMPT ==========');
  console.log('📧 Recipient:', to);
  console.log('📧 Name:', name);
  console.log('📧 Plan:', planName, '- ₹', planPrice);
  console.log('📧 Credential Email:', email);
  console.log('📧 Website Link:', websiteUrl);
  
  const transporter = createTransporter();
  
  if (!transporter) {
    console.log('❌ Email service not configured. Credentials should be sent via frontend.');
    console.log('❌ Missing: SMTP_HOST/SMTP_USER/SMTP_PASS or GMAIL_USER/GMAIL_APP_PASSWORD');
    return {
      success: false,
      message: 'Email service not configured',
      method: 'none',
    };
  }

  console.log('✅ Email transporter created successfully');
  console.log('📧 SMTP Config:', {
    host: process.env.SMTP_HOST || 'Gmail',
    port: process.env.SMTP_PORT || 587,
    user: process.env.SMTP_USER || process.env.GMAIL_USER,
    from: process.env.SMTP_FROM || process.env.GMAIL_USER || 'noreply@mansionmuse.com'
  });

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.GMAIL_USER || 'noreply@mansionmuse.com',
    to,
    subject: `Welcome to Mansion Muse - Your ${planName} Plan is Active!`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Mansion Muse</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f7; color: #333;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f7; padding: 20px 0;">
              <tr>
                  <td align="center">
                      <table border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                          
                          <!-- Header -->
                          <tr>
                              <td align="center" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 40px 20px;">
                                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px; font-weight: 700;">MANSION MUSE</h1>
                                  <p style="color: #a0a0a0; margin: 10px 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Premium PG Management</p>
                              </td>
                          </tr>

                          <!-- Hero Section -->
                          <tr>
                              <td align="center" style="padding: 40px 40px 20px;">
                                  <div style="background-color: #e0f2fe; color: #0369a1; padding: 8px 16px; border-radius: 50px; display: inline-block; font-size: 14px; font-weight: 600; margin-bottom: 20px;">
                                      🎉 Registration Successful
                                  </div>
                                  <h2 style="color: #1a1a2e; margin: 0 0 15px; font-size: 24px;">Welcome, ${name}!</h2>
                                  <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0;">
                                      We are thrilled to have you onboard. Your subscription to the <strong style="color: #764ba2;">${planName} Plan</strong> is now active.
                                  </p>
                              </td>
                          </tr>

                          <!-- Credentials Section -->
                          <tr>
                              <td style="padding: 20px 40px;">
                                  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px;">
                                      <h3 style="color: #334155; margin: 0 0 20px; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
                                          Your Login Credentials
                                      </h3>
                                      
                                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                          <tr>
                                              <td width="30%" style="padding: 10px 0; color: #64748b; font-size: 14px;"><strong>Email:</strong></td>
                                              <td style="padding: 10px 0; color: #333; font-size: 15px;">${email}</td>
                                          </tr>
                                          <tr>
                                              <td width="30%" style="padding: 10px 0; color: #64748b; font-size: 14px;"><strong>Password:</strong></td>
                                              <td style="padding: 10px 0;">
                                                  <span style="background-color: #f1f5f9; padding: 6px 12px; border-radius: 4px; font-family: monospace; font-size: 16px; letter-spacing: 1px; color: #0f172a; border: 1px solid #cbd5e1;">${password}</span>
                                              </td>
                                          </tr>
                                          <tr>
                                              <td width="30%" style="padding: 10px 0; color: #64748b; font-size: 14px;"><strong>Plan Price:</strong></td>
                                              <td style="padding: 10px 0; color: #333; font-size: 15px;">₹${planPrice}</td>
                                          </tr>
                                      </table>

                                      <div style="margin-top: 20px; padding: 12px; background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px; font-size: 13px; color: #92400e; line-height: 1.5;">
                                          <strong>Security Note:</strong> For your security, please change your password immediately after your first login.
                                      </div>
                                  </div>
                              </td>
                          </tr>

                          <!-- CTA Button -->
                          <tr>
                              <td align="center" style="padding: 20px 40px 40px;">
                                  <a href="${websiteUrl}" style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.3);">
                                      Access Your Dashboard
                                  </a>
                              </td>
                          </tr>

                          <!-- Footer -->
                          <tr>
                              <td style="background-color: #f8fafc; padding: 30px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                                  <p style="margin: 0 0 10px; color: #64748b; font-size: 14px;">Need help? Contact our support team.</p>
                                  <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                                      &copy; ${new Date().getFullYear()} Mansion Muse. All rights reserved.<br>
                                      This is an automated message, please do not reply.
                                  </p>
                              </td>
                          </tr>
                      </table>
                  </td>
              </tr>
          </table>
      </body>
      </html>
    `,
  };

  console.log('📧 Mail options prepared');
  console.log('📧 Sending email to:', to);

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ ========== EMAIL SENT SUCCESSFULLY ==========');
    console.log('✅ Message ID:', result.messageId);
    console.log('✅ Response:', result.response);
    return {
      success: true,
      message: 'Welcome email sent successfully',
      method: 'smtp',
    };
  } catch (error) {
    console.error('❌ ========== EMAIL SENDING FAILED ==========');
    console.error('❌ Error:', error.message);
    console.error('❌ Full error:', error);
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
