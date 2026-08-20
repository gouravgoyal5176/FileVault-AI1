import { smtpTransport, isSmtpConfigured, getSmtpSenderEmail } from '../config/smtp';

export interface ShareNotificationInput {
  recipientEmail: string;
  sharedByEmail: string;
  originalFilename: string;
  permission: 'VIEW' | 'DOWNLOAD';
  expiresAt?: string | Date | null;
  frontendUrl?: string;
}

export function generateShareEmailHtml(input: ShareNotificationInput): string {
  const appUrl = input.frontendUrl || process.env.FRONTEND_URL || 'http://localhost:5173';
  const expirationText = input.expiresAt
    ? new Date(input.expiresAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Never (Permanent Access)';

  const permissionBadgeColor = input.permission === 'DOWNLOAD' ? '#059669' : '#7c3aed';
  const permissionBg = input.permission === 'DOWNLOAD' ? '#ecfdf5' : '#f5f3ff';
  const permissionBorder = input.permission === 'DOWNLOAD' ? '#a7f3d0' : '#ddd6fe';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>FileVault AI — Shared File Notification</title>
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8fafc; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:540px; background-color:#ffffff; border:1px solid #e2e8f0; border-radius:16px; overflow:hidden; box-shadow:0 10px 25px -5px rgba(0,0,0,0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background-color:#4f46e5; padding: 24px 32px; text-align: left;">
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size:20px; font-weight:800; color:#ffffff; letter-spacing:-0.5px;">FileVault AI</span>
                    <span style="display:inline-block; margin-left:8px; padding:2px 8px; background-color:rgba(255,255,255,0.2); border-radius:6px; font-size:10px; font-weight:700; color:#ffffff; text-transform:uppercase; tracking:1px;">Zero-Trust Encryption</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin:0 0 12px 0; font-size:18px; font-weight:800; color:#0f172a;">An Encrypted File Has Been Shared With You</h2>
              <p style="margin:0 0 24px 0; font-size:14px; color:#475569; line-height:1.5;">
                <strong style="color:#0f172a;">${input.sharedByEmail}</strong> has granted you secure access to a file stored in FileVault AI.
              </p>

              <!-- File Info Card -->
              <table width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:16px; margin-bottom:24px;">
                <tr>
                  <td style="padding-bottom:12px; border-bottom:1px solid #f1f5f9;">
                    <span style="font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px;">File Name</span>
                    <div style="font-size:15px; font-weight:700; color:#0f172a; margin-top:4px;">${input.originalFilename}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:12px;">
                    <table width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="50%">
                          <span style="font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px;">Permission</span>
                          <div style="margin-top:4px;">
                            <span style="display:inline-block; padding:4px 10px; background-color:${permissionBg}; border:1px solid ${permissionBorder}; color:${permissionBadgeColor}; font-size:11px; font-weight:800; border-radius:20px; text-transform:uppercase;">
                              ${input.permission === 'DOWNLOAD' ? '✓ DOWNLOAD ALLOWED' : '👁 VIEW ONLY'}
                            </span>
                          </div>
                        </td>
                        <td width="50%">
                          <span style="font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px;">Expiration</span>
                          <div style="font-size:12px; font-weight:600; color:#334155; margin-top:4px;">${expirationText}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Call to Action -->
              <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}" target="_blank" style="display:inline-block; padding:14px 28px; background-color:#4f46e5; color:#ffffff; text-decoration:none; font-size:14px; font-weight:700; border-radius:10px; box-shadow:0 4px 12px rgba(79,70,229,0.25);">
                      Open FileVault AI &amp; Access File →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <table width="100%" cellspacing="0" cellpadding="0" style="background-color:#fffbe0; border:1px solid #fde047; border-radius:10px; padding:12px 16px;">
                <tr>
                  <td>
                    <span style="font-size:11px; font-weight:700; color:#854d0e; text-transform:uppercase;">🔒 Security &amp; Privacy Notice</span>
                    <p style="margin:4px 0 0 0; font-size:12px; color:#713f12; line-height:1.4;">
                      This file is protected with AES-256-GCM envelope encryption. You must be logged into FileVault AI with account <strong style="color:#451a03;">${input.recipientEmail}</strong> to view or download this file.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f1f5f9; padding: 16px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin:0; font-size:11px; color:#64748b;">
                © FileVault AI — Military-Grade Encrypted Cloud Storage System
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendShareNotificationEmail(
  input: ShareNotificationInput
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!isSmtpConfigured()) {
    console.warn(`[SMTP WARN] Cannot send share notification to ${input.recipientEmail}: SMTP_USER or SMTP_PASS not set.`);
    return {
      success: false,
      error: 'SMTP credentials (SMTP_USER / SMTP_PASS) not configured on backend server.',
    };
  }

  try {
    const sender = getSmtpSenderEmail();
    const html = generateShareEmailHtml(input);

    const mailOptions = {
      from: `"FileVault AI" <${sender}>`,
      to: input.recipientEmail,
      subject: `FileVault AI — An encrypted file has been shared with you (${input.originalFilename})`,
      html,
    };

    const info = await smtpTransport.sendMail(mailOptions);
    console.log(`[SMTP SUCCESS] Notification email delivered to ${input.recipientEmail}. MessageId: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error(`[SMTP ERROR] Failed to send share notification to ${input.recipientEmail}:`, error.message);
    return {
      success: false,
      error: error.message || 'Failed to dispatch email via SMTP.',
    };
  }
}

export interface RegistrationOtpInput {
  recipientEmail: string;
  otp: string;
}

export function generateOtpEmailHtml(input: RegistrationOtpInput): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>FileVault AI — Verification Code</title>
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8fafc; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:500px; background-color:#ffffff; border:1px solid #e2e8f0; border-radius:16px; overflow:hidden; box-shadow:0 10px 25px -5px rgba(0,0,0,0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background-color:#4f46e5; padding: 24px 32px; text-align: left;">
              <span style="font-size:20px; font-weight:800; color:#ffffff; letter-spacing:-0.5px;">FileVault AI</span>
              <span style="display:inline-block; margin-left:8px; padding:2px 8px; background-color:rgba(255,255,255,0.2); border-radius:6px; font-size:10px; font-weight:700; color:#ffffff; text-transform:uppercase;">Identity Verification</span>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin:0 0 12px 0; font-size:18px; font-weight:800; color:#0f172a;">Verify Your Email Address</h2>
              <p style="margin:0 0 24px 0; font-size:14px; color:#475569; line-height:1.5;">
                Please use the 6-digit verification code below to complete your registration for account <strong style="color:#0f172a;">${input.recipientEmail}</strong>.
              </p>

              <!-- OTP Code Display -->
              <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center" style="background-color:#f1f5f9; border:2px dashed #cbd5e1; border-radius:12px; padding:20px;">
                    <div style="font-size:32px; font-weight:900; letter-spacing:10px; color:#4f46e5; font-mono;">${input.otp}</div>
                    <div style="font-size:11px; font-weight:600; color:#64748b; margin-top:6px; text-transform:uppercase; letter-spacing:1px;">Expires in 5 minutes</div>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <table width="100%" cellspacing="0" cellpadding="0" style="background-color:#fffbe0; border:1px solid #fde047; border-radius:10px; padding:12px 16px;">
                <tr>
                  <td>
                    <span style="font-size:11px; font-weight:700; color:#854d0e; text-transform:uppercase;">🔒 Security Notice</span>
                    <p style="margin:4px 0 0 0; font-size:12px; color:#713f12; line-height:1.4;">
                      If you did not request this verification code, please ignore this email. Never share this code with anyone. FileVault AI staff will never ask for your verification code.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f1f5f9; padding: 16px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin:0; font-size:11px; color:#64748b;">
                © FileVault AI — Military-Grade Encrypted Cloud Storage System
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendRegistrationOtpEmail(
  input: RegistrationOtpInput
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!isSmtpConfigured()) {
    console.warn(`[SMTP WARN] Cannot send registration OTP to ${input.recipientEmail}: SMTP_USER or SMTP_PASS not set.`);
    return {
      success: false,
      error: 'SMTP credentials (SMTP_USER / SMTP_PASS) not configured on backend server.',
    };
  }

  try {
    const sender = getSmtpSenderEmail();
    const html = generateOtpEmailHtml(input);

    const mailOptions = {
      from: `"FileVault AI" <${sender}>`,
      to: input.recipientEmail,
      subject: `FileVault AI — Registration Verification Code (${input.otp})`,
      html,
    };

    const info = await smtpTransport.sendMail(mailOptions);
    console.log(`[SMTP SUCCESS] Registration OTP email delivered to ${input.recipientEmail}. MessageId: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error(`[SMTP ERROR] Failed to send registration OTP email to ${input.recipientEmail}:`, error.message);
    return {
      success: false,
      error: error.message || 'Failed to dispatch email via SMTP.',
    };
  }
}

export interface LoginOtpInput {
  recipientEmail: string;
  otp: string;
}

export function generateLoginOtpEmailHtml(input: LoginOtpInput): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>FileVault AI — Login Verification Code</title>
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8fafc; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:500px; background-color:#ffffff; border:1px solid #e2e8f0; border-radius:16px; overflow:hidden; box-shadow:0 10px 25px -5px rgba(0,0,0,0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background-color:#4f46e5; padding: 24px 32px; text-align: left;">
              <span style="font-size:20px; font-weight:800; color:#ffffff; letter-spacing:-0.5px;">FileVault AI</span>
              <span style="display:inline-block; margin-left:8px; padding:2px 8px; background-color:rgba(255,255,255,0.2); border-radius:6px; font-size:10px; font-weight:700; color:#ffffff; text-transform:uppercase;">Login MFA Verification</span>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin:0 0 12px 0; font-size:18px; font-weight:800; color:#0f172a;">Verify Your Vault Login</h2>
              <p style="margin:0 0 24px 0; font-size:14px; color:#475569; line-height:1.5;">
                A sign-in attempt was initiated for your vault account <strong style="color:#0f172a;">${input.recipientEmail}</strong>. Please use the 6-digit MFA verification code below to complete your login.
              </p>

              <!-- OTP Code Display -->
              <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center" style="background-color:#f1f5f9; border:2px dashed #cbd5e1; border-radius:12px; padding:20px;">
                    <div style="font-size:32px; font-weight:900; letter-spacing:10px; color:#4f46e5; font-mono;">${input.otp}</div>
                    <div style="font-size:11px; font-weight:600; color:#64748b; margin-top:6px; text-transform:uppercase; letter-spacing:1px;">Expires in 5 minutes</div>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <table width="100%" cellspacing="0" cellpadding="0" style="background-color:#fffbe0; border:1px solid #fde047; border-radius:10px; padding:12px 16px;">
                <tr>
                  <td>
                    <span style="font-size:11px; font-weight:700; color:#854d0e; text-transform:uppercase;">🔒 Security Alert</span>
                    <p style="margin:4px 0 0 0; font-size:12px; color:#713f12; line-height:1.4;">
                      If you did not initiate this login request, your account password may be compromised. Please reset your password immediately. Never share this code with anyone.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f1f5f9; padding: 16px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin:0; font-size:11px; color:#64748b;">
                © FileVault AI — Military-Grade Encrypted Cloud Storage System
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendLoginOtpEmail(
  input: LoginOtpInput
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!isSmtpConfigured()) {
    console.warn(`[SMTP WARN] Cannot send login OTP to ${input.recipientEmail}: SMTP_USER or SMTP_PASS not set.`);
    return {
      success: false,
      error: 'SMTP credentials (SMTP_USER / SMTP_PASS) not configured on backend server.',
    };
  }

  try {
    const sender = getSmtpSenderEmail();
    const html = generateLoginOtpEmailHtml(input);

    const mailOptions = {
      from: `"FileVault AI" <${sender}>`,
      to: input.recipientEmail,
      subject: `FileVault AI — Login Verification Code (${input.otp})`,
      html,
    };

    const info = await smtpTransport.sendMail(mailOptions);
    console.log(`[SMTP SUCCESS] Login OTP email delivered to ${input.recipientEmail}. MessageId: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error(`[SMTP ERROR] Failed to send login OTP email to ${input.recipientEmail}:`, error.message);
    return {
      success: false,
      error: error.message || 'Failed to dispatch email via SMTP.',
    };
  }
}
