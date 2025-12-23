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
  
  const ownerFrontendUrl = process.env.OWNER_FRONTEND_URL || 'https://mansion-muse.vercel.app/';
  return `${ownerFrontendUrl}`;
};

/**
 * Create email transporter
 * @returns {object} Nodemailer transporter
 */
const createTransporter = () => {
  // Check if SMTP credentials are available
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const port = parseInt(process.env.SMTP_PORT) || 587;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    console.log(`📧 Configuring SMTP Transporter: ${process.env.SMTP_HOST}:${port} (Secure: ${secure})`);

    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: port,
      secure: secure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // Increase connection timeout to 10 seconds
      connectionTimeout: 10000, 
      // Ensure we don't hang indefinitely
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });
  }
  
  // Fallback to Gmail if configured
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    console.log(`📧 Configuring Gmail Service Transporter for: ${process.env.GMAIL_USER}`);
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  
  console.error('❌ No email configuration found in environment variables.');
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
  
  const transporter = createTransporter();
  
  if (!transporter) {
    console.log('❌ Email service not configured.');
    return { success: false, message: 'Email service not configured' };
  }

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
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f7; color: #333;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f7; padding: 20px 0;">
              <tr>
                  <td align="center">
                      <table border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
                          <!-- Header -->
                          <tr>
                              <td align="center" style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 20px;">
                                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px; font-weight: 700;">MANSION MUSE</h1>
                                  <p style="color: #e0e7ff; margin: 10px 0 0; font-size: 14px; text-transform: uppercase;">Premium PG Management</p>
                              </td>
                          </tr>
                          <!-- Content -->
                          <tr>
                              <td style="padding: 40px;">
                                  <h2 style="color: #1a1a2e; margin: 0 0 20px; font-size: 24px;">Welcome, ${name}!</h2>
                                  <p style="color: #4b5563; line-height: 1.6; margin-bottom: 25px;">
                                      Thank you for choosing Mansion Muse. Your <strong>${planName}</strong> plan is now active.
                                  </p>
                                  
                                  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
                                      <h3 style="color: #334155; margin: 0 0 15px; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Login Credentials</h3>
                                      <table width="100%" cellpadding="5">
                                          <tr>
                                              <td style="color: #64748b; font-weight: 600;" width="30%">Email:</td>
                                              <td style="color: #334155;">${email}</td>
                                          </tr>
                                          <tr>
                                              <td style="color: #64748b; font-weight: 600;">Password:</td>
                                              <td style="font-family: monospace; background: #f1f5f9; padding: 4px 8px; border-radius: 4px;">${password}</td>
                                          </tr>
                                          <tr>
                                              <td style="color: #64748b; font-weight: 600;">Plan Price:</td>
                                              <td style="color: #334155;">₹${planPrice}</td>
                                          </tr>
                                      </table>
                                  </div>
                                  
                                  <a href="${websiteUrl}" style="display: block; text-align: center; background: #4f46e5; color: #ffffff; text-decoration: none; padding: 14px 20px; border-radius: 8px; font-weight: 600; margin-top: 20px;">Access Dashboard</a>
                              </td>
                          </tr>
                          <!-- Footer -->
                          <tr>
                              <td style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                                  <p style="margin: 0; color: #94a3b8; font-size: 12px;">&copy; ${new Date().getFullYear()} Mansion Muse. Automated message.</p>
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

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Send Tenant Registration Email with Full Bio-Data
 */
export const sendTenantWelcomeEmail = async (tenant) => {
  const { name, email, room, rentAmount, securityDeposit, depositStatus, paymentStatus, joiningDate, property, owner } = tenant;
  
  if (!email) return;

  const transporter = createTransporter();
  if (!transporter) return;

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.GMAIL_USER || 'noreply@mansionmuse.com',
    to: email,
    subject: `Welcome to ${property?.name || 'Our PG'} - Registration Confirmed`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;font-family:'Segoe UI',sans-serif;background-color:#f3f4f6;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f3f4f6;padding:20px 0;">
          <tr>
            <td align="center">
              <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);padding:40px;text-align:center;">
                    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">Registration Confirmed!</h1>
                    <p style="color:#bfdbfe;margin:10px 0 0;font-size:16px;">Welcome to your new home</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding:40px;">
                    <p style="color:#374151;font-size:16px;line-height:24px;margin-bottom:24px;">
                      Hi <strong>${name}</strong>,<br>
                      We're excited to have you at <strong>${property?.name || 'our property'}</strong>. Here are your registration details and current status.
                    </p>

                    <!-- Status Cards -->
                    <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
                      <tr>
                        <td width="48%" style="padding:15px;background-color:#f0f9ff;border-radius:12px;border:1px solid #bae6fd;">
                          <div style="font-size:12px;color:#0369a1;font-weight:600;text-transform:uppercase;">Rent Status</div>
                          <div style="font-size:18px;color:#0c4a6e;font-weight:700;margin-top:4px;">${paymentStatus}</div>
                        </td>
                        <td width="4%"></td>
                        <td width="48%" style="padding:15px;background-color:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0;">
                          <div style="font-size:12px;color:#15803d;font-weight:600;text-transform:uppercase;">Deposit Status</div>
                          <div style="font-size:18px;color:#14532d;font-weight:700;margin-top:4px;">${depositStatus}</div>
                        </td>
                      </tr>
                    </table>

                    <!-- Details Table -->
                    <div style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
                        <table width="100%" cellspacing="0" cellpadding="15">
                            <tr style="border-bottom:1px solid #e5e7eb;">
                                <td style="background:#f9fafb;color:#6b7280;font-size:14px;font-weight:600;width:40%;">Room Number</td>
                                <td style="color:#111827;font-size:14px;font-weight:600;">${room?.roomNumber || 'Not Assigned'}</td>
                            </tr>
                            <tr style="border-bottom:1px solid #e5e7eb;">
                                <td style="background:#f9fafb;color:#6b7280;font-size:14px;font-weight:600;">Monthly Rent</td>
                                <td style="color:#111827;font-size:14px;font-weight:600;">₹${rentAmount}</td>
                            </tr>
                            <tr style="border-bottom:1px solid #e5e7eb;">
                                <td style="background:#f9fafb;color:#6b7280;font-size:14px;font-weight:600;">Security Deposit</td>
                                <td style="color:#111827;font-size:14px;font-weight:600;">₹${securityDeposit}</td>
                            </tr>
                            <tr>
                                <td style="background:#f9fafb;color:#6b7280;font-size:14px;font-weight:600;">Joining Date</td>
                                <td style="color:#111827;font-size:14px;font-weight:600;">${new Date(joiningDate).toLocaleDateString()}</td>
                            </tr>
                        </table>
                    </div>

                    <p style="margin-top:30px;font-size:14px;color:#6b7280;text-align:center;">
                        Please save this email for your records. If you have any questions, please contact the property manager.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
                    <p style="margin:0;color:#9ca3af;font-size:12px;">&copy; ${new Date().getFullYear()} Mansion Muse · Automated System</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Tenant welcome email sent to ${email}`);
  } catch (error) {
    console.error('❌ Failed to send tenant welcome email:', error);
  }
};

/**
 * Send Rent Payment Confirmation (Student)
 */
export const sendRentPaymentConfirmationEmail = async (payment) => {
  const { tenant, amount, paymentDate, property, month, year } = payment;
  if (!tenant?.email) return;

  const transporter = createTransporter();
  if (!transporter) return;

  const formattedDate = paymentDate ? new Date(paymentDate).toLocaleDateString() : new Date().toLocaleDateString();
  const receiptNo = `RCPT-${Math.floor(Math.random() * 1000000)}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.GMAIL_USER || 'noreply@mansionmuse.com',
    to: tenant.email,
    subject: `Rent Payment Receipt - ₹${amount} Received`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background-color:#eef2f6;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding:20px 0;">
          <tr>
            <td align="center">
              <table width="600" border="0" cellspacing="0" cellpadding="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.05);">
                <!-- Brand Header -->
                <tr>
                  <td style="background:#059669;padding:30px;text-align:center;">
                    <div style="color:#fff;font-size:24px;font-weight:bold;letter-spacing:1px;">PAYMENT SUCCESSFUL</div>
                    <div style="color:#a7f3d0;font-size:14px;margin-top:5px;">Thank you for your timely payment</div>
                  </td>
                </tr>

                <!-- Receipt Body -->
                <tr>
                  <td style="padding:40px;">
                    <div style="text-align:center;margin-bottom:30px;">
                      <h1 style="margin:0;font-size:48px;color:#059669;">₹${amount}</h1>
                      <p style="margin:10px 0 0;color:#6b7280;text-transform:uppercase;font-size:12px;letter-spacing:1px;">Amount Paid</p>
                    </div>

                    <div style="background:#f0fdf4;border:1px dashed #059669;border-radius:8px;padding:20px;">
                      <table width="100%">
                        <tr>
                          <td style="color:#6b7280;font-size:14px;padding:5px 0;">Receipt No:</td>
                          <td style="text-align:right;color:#1f2937;font-weight:bold;">${receiptNo}</td>
                        </tr>
                        <tr>
                          <td style="color:#6b7280;font-size:14px;padding:5px 0;">Paid By:</td>
                          <td style="text-align:right;color:#1f2937;font-weight:bold;">${tenant.name}</td>
                        </tr>
                        <tr>
                          <td style="color:#6b7280;font-size:14px;padding:5px 0;">Date:</td>
                          <td style="text-align:right;color:#1f2937;font-weight:bold;">${formattedDate}</td>
                        </tr>
                         <tr>
                          <td style="color:#6b7280;font-size:14px;padding:5px 0;">Property:</td>
                          <td style="text-align:right;color:#1f2937;font-weight:bold;">${property?.name || 'PG Property'}</td>
                        </tr>
                      </table>
                    </div>

                    <p style="margin-top:25px;text-align:center;color:#6b7280;font-size:14px;">
                      This email serves as an official receipt for your rent payment.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Rent receipt sent to ${tenant.email}`);
  } catch (error) {
    console.error('❌ Failed to send rent receipt:', error);
  }
};

/**
 * Send Salary Credit Confirmation (Staff)
 */
export const sendSalaryCreditEmail = async (expense) => {
  const { staff, amount, date, property } = expense;
  // If staff object is populated, use its email.
  const email = staff?.email;
  const name = staff?.name || expense.paidTo;
  
  if (!email) return;

  const transporter = createTransporter();
  if (!transporter) return;

  const formattedDate = date ? new Date(date).toLocaleDateString() : new Date().toLocaleDateString();

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.GMAIL_USER || 'noreply@mansionmuse.com',
    to: email,
    subject: `Salary Credited - ₹${amount}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;font-family:'Segoe UI',sans-serif;background-color:#f8fafc;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding:20px 0;">
          <tr>
            <td align="center">
              <table width="600" border="0" cellspacing="0" cellpadding="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background:#0f172a;padding:30px;text-align:center;">
                    <div style="width:60px;height:60px;background:#3b82f6;border-radius:50%;margin:0 auto 15px;display:flex;align-items:center;justify-content:center;font-size:30px;">💰</div>
                    <h2 style="color:#fff;margin:0;font-weight:600;">Salary Credited</h2>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding:40px;">
                    <p style="color:#334155;font-size:16px;margin-bottom:24px;">
                      Dear <strong>${name}</strong>,<br>
                      Your salary for this month has been successfully credited to your account.
                    </p>

                    <div style="background:#eff6ff;padding:24px;border-radius:8px;text-align:center;margin-bottom:24px;">
                        <div style="font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Credited Amount</div>
                        <div style="font-size:36px;color:#2563eb;font-weight:800;">₹${amount}</div>
                    </div>

                    <table width="100%" style="border-collapse:collapse;">
                        <tr style="border-bottom:1px solid #e2e8f0;">
                            <td style="padding:12px 0;color:#64748b;font-size:14px;">Date</td>
                            <td style="padding:12px 0;text-align:right;color:#0f172a;font-weight:600;">${formattedDate}</td>
                        </tr>
                        <tr style="border-bottom:1px solid #e2e8f0;">
                            <td style="padding:12px 0;color:#64748b;font-size:14px;">Property</td>
                            <td style="padding:12px 0;text-align:right;color:#0f172a;font-weight:600;">${property?.name || 'Mansion Muse'}</td>
                        </tr>
                        <tr>
                            <td style="padding:12px 0;color:#64748b;font-size:14px;">Status</td>
                            <td style="padding:12px 0;text-align:right;color:#16a34a;font-weight:600;">Success</td>
                        </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#f1f5f9;padding:20px;text-align:center;">
                    <p style="margin:0;color:#94a3b8;font-size:12px;">This is a system generated email.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Salary email sent to ${email}`);
  } catch (error) {
    console.error('❌ Failed to send salary email:', error);
  }
};

/**
 * Send Weekly Meal Schedule Email
 */
export const sendMealScheduleEmail = async (tenant, menu, property) => {
  if (!tenant?.email) return;

  const transporter = createTransporter();
  if (!transporter) return;

  const getDayItems = (dayData) => {
    if (!dayData) return { breakfast: '-', lunch: '-', dinner: '-' };
    return {
      breakfast: dayData.breakfast && dayData.breakfast.length > 0 ? dayData.breakfast.join(', ') : '-',
      lunch: dayData.lunch && dayData.lunch.length > 0 ? dayData.lunch.join(', ') : '-',
      dinner: dayData.dinner && dayData.dinner.length > 0 ? dayData.dinner.join(', ') : '-'
    };
  };

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  let menuRows = '';
  days.forEach(day => {
    const dayData = menu.weeklyMenu[day];
    const items = getDayItems(dayData);
    const dayName = day.charAt(0).toUpperCase() + day.slice(1);
    
    menuRows += `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px 0; color: #1e293b; font-weight: 600;">${dayName}</td>
        <td style="padding: 12px 10px; color: #64748b; font-size: 14px;">${items.breakfast}</td>
        <td style="padding: 12px 10px; color: #64748b; font-size: 14px;">${items.lunch}</td>
        <td style="padding: 12px 0; color: #64748b; font-size: 14px;">${items.dinner}</td>
      </tr>
    `;
  });

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.GMAIL_USER || 'noreply@mansionmuse.com',
    to: tenant.email,
    subject: `Weekly Meal Schedule Updated - ${property?.name || 'Mansion Muse'}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;font-family:'Segoe UI',sans-serif;background-color:#fff7ed;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding:20px 0;">
          <tr>
            <td align="center">
              <table width="600" border="0" cellspacing="0" cellpadding="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background:#ea580c;padding:30px;text-align:center;">
                    <div style="font-size:32px;margin-bottom:10px;">🍲</div>
                    <h2 style="color:#fff;margin:0;font-weight:700;">New Menu Alert!</h2>
                    <p style="color:#fed7aa;margin:5px 0 0;font-size:14px;">Check out what's cooking this week</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding:30px;">
                    <p style="color:#334155;font-size:15px;line-height:1.5;margin-bottom:20px;">
                      Hi <strong>${tenant.name}</strong>,<br>
                      The meal schedule for the week starting <strong>${new Date(menu.startDate).toLocaleDateString()}</strong> has been updated.
                    </p>

                    <div style="overflow-x:auto;">
                      <table width="100%" style="border-collapse:collapse;min-width:500px;">
                        <tr style="text-align:left;">
                          <th style="padding-bottom:12px;color:#9a3412;font-size:12px;text-transform:uppercase;width:15%">Day</th>
                          <th style="padding-bottom:12px;color:#9a3412;font-size:12px;text-transform:uppercase;width:28%">Breakfast</th>
                          <th style="padding-bottom:12px;color:#9a3412;font-size:12px;text-transform:uppercase;width:28%">Lunch</th>
                          <th style="padding-bottom:12px;color:#9a3412;font-size:12px;text-transform:uppercase;width:28%">Dinner</th>
                        </tr>
                        ${menuRows}
                      </table>
                    </div>

                    <div style="margin-top:30px;background:#fefce8;padding:15px;border-radius:8px;border:1px dashed #eab308;text-align:center;">
                      <p style="margin:0;color:#854d0e;font-size:13px;">
                        <strong>Note:</strong> Menu items are subject to availability and seasonal changes.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color:#fff7ed;padding:20px;text-align:center;">
                    <p style="margin:0;color:#9a3412;font-size:12px;">Bon Appétit! 😋</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Menu email sent to ${tenant.email}`);
  } catch (error) {
    console.error('❌ Failed to send menu email:', error);
  }
};

/**
 * Send Tenant Departure/Account Deletion Email
 */
export const sendTenantDepartureEmail = async (tenant) => {
  if (!tenant?.email) return;

  const transporter = createTransporter();
  if (!transporter) return;

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.GMAIL_USER || 'noreply@mansionmuse.com',
    to: tenant.email,
    subject: `Farewell from Mansion Muse - Account Deactivated`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;font-family:'Segoe UI',sans-serif;background-color:#fef2f2;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding:20px 0;">
          <tr>
            <td align="center">
              <table width="600" border="0" cellspacing="0" cellpadding="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background:#dc2626;padding:30px;text-align:center;">
                    <div style="font-size:32px;margin-bottom:10px;">👋</div>
                    <h2 style="color:#fff;margin:0;font-weight:700;">Goodbye & Good Luck!</h2>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding:40px;">
                    <p style="color:#334155;font-size:16px;line-height:1.6;margin-bottom:24px;">
                      Dear <strong>${tenant.name}</strong>,<br>
                      Your stay with us has officially ended, and your account has been deactivated.
                    </p>

                    <div style="background:#fff5f5;border-left:4px solid #ef4444;padding:20px;margin-bottom:24px;">
                      <p style="margin:0;color:#991b1b;font-size:14px;">
                        <strong>Note:</strong> You will no longer have access to the tenant dashboard or property services.
                      </p>
                    </div>

                    <p style="color:#475569;font-size:15px;line-height:1.6;">
                      We hope you had a pleasant stay! We wish you all the very best for your future endeavors.
                    </p>
                    
                    <p style="margin-top:30px;color:#cbd5e1;font-size:14px;text-align:center;">
                      — The Management Team
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Departure email sent to ${tenant.email}`);
  } catch (error) {
    console.error('❌ Failed to send departure email:', error);
  }
};

export default {
  generateRandomPassword,
  generateWebsiteUrl,
  sendWelcomeEmail,
  sendTenantWelcomeEmail,
  sendRentPaymentConfirmationEmail,
  sendSalaryCreditEmail,
  sendMealScheduleEmail,
  sendTenantDepartureEmail
};

