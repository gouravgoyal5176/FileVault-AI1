import { smtpTransport, isSmtpConfigured, getSmtpSenderEmail } from '../config/smtp';

export interface ShareNotificationInput {
  recipientEmail: string;
  sharedByEmail: string;
  originalFilename: string;
  permission: 'VIEW' | 'DOWNLOAD';
  expiresAt?: string | Date | null;
  frontendUrl?: string;
}

export function isTestDomainEmail(email: string): boolean {
  const domain = (email.split('@')[1] || '').toLowerCase();
  return (
    domain === 'example.com' ||
    domain.endsWith('.example.com') ||
    domain === 'example.org' ||
    domain === 'example.net' ||
    domain.endsWith('.test') ||
    domain === 'test.local'
  );
}

export function generateShareEmailText(input: ShareNotificationInput): string {
  const appUrl = input.frontendUrl || process.env.FRONTEND_URL || 'http://localhost:5173';
  const expirationText = input.expiresAt
    ? new Date(input.expiresAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Permanent Access';

  return [
    'FileVault AI — A file has been shared with you',
    '',
    `${input.sharedByEmail} has shared an encrypted file with you on FileVault AI.`,
    '',
    'File Details:',
    `- Name: ${input.originalFilename}`,
    `- Permission: ${input.permission === 'DOWNLOAD' ? 'Download Allowed' : 'View Only'}`,
    `- Expiration: ${expirationText}`,
    '',
    `Access your shared file at: ${appUrl}`,
    '',
    'If you were not expecting this file share, you can safely ignore this email.',
    '',
    'FileVault AI Encrypted Storage',
  ].join('\n');
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
    : 'Permanent Access';

  const permText = input.permission === 'DOWNLOAD' ? 'Download Allowed' : 'View Only';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FileVault AI — Shared File</title>
</head>
<body style="margin:0; padding:20px; background-color:#f4f6f9; font-family:Arial, sans-serif; color:#1f2937;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px; margin:0 auto; background-color:#ffffff; border:1px solid #e5e7eb; border-radius:8px; overflow:hidden;">
    <tr>
      <td style="background-color:#3b82f6; padding:20px 24px; text-align:left;">
        <h1 style="margin:0; font-size:20px; color:#ffffff; font-weight:bold; letter-spacing:-0.5px;">FileVault AI</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:28px 24px;">
        <h2 style="margin:0 0 12px 0; font-size:16px; color:#111827; font-weight:bold;">A file has been shared with you</h2>
        <p style="margin:0 0 20px 0; font-size:14px; color:#4b5563; line-height:1.5;">
          <strong>${input.sharedByEmail}</strong> has granted you secure access to a file on FileVault AI.
        </p>

        <table width="100%" cellspacing="0" cellpadding="0" style="background-color:#f9fafb; border:1px solid #e5e7eb; border-radius:6px; margin-bottom:20px;">
          <tr>
            <td style="padding:12px 16px; border-bottom:1px solid #e5e7eb; font-size:13px; color:#6b7280;">
              <strong>File Name:</strong> <span style="color:#111827;">${input.originalFilename}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 16px; border-bottom:1px solid #e5e7eb; font-size:13px; color:#6b7280;">
              <strong>Permission:</strong> <span style="color:#111827;">${permText}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 16px; font-size:13px; color:#6b7280;">
              <strong>Access Expiration:</strong> <span style="color:#111827;">${expirationText}</span>
            </td>
          </tr>
        </table>

        <div style="text-align:center; margin:24px 0;">
          <a href="${appUrl}" target="_blank" style="display:inline-block; padding:12px 24px; background-color:#2563eb; color:#ffffff; text-decoration:none; font-size:14px; font-weight:bold; border-radius:6px;">
            Open FileVault AI
          </a>
        </div>

        <p style="margin:20px 0 0 0; font-size:12px; color:#9ca3af; line-height:1.4;">
          Note: You must sign into FileVault AI with account <strong>${input.recipientEmail}</strong> to access this file.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color:#f9fafb; padding:16px 24px; text-align:center; border-top:1px solid #e5e7eb;">
        <p style="margin:0; font-size:12px; color:#9ca3af;">
          © FileVault AI Encrypted Storage
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendShareNotificationEmail(
  input: ShareNotificationInput
): Promise<{
  success: boolean;
  messageId?: string;
  accepted?: string[];
  rejected?: string[];
  response?: string;
  error?: string;
}> {
  const targetRecipient = (input.recipientEmail || '').trim().toLowerCase();

  if (!targetRecipient) {
    console.error('[SMTP ERROR] Cannot send share notification: recipient email is empty.');
    return { success: false, error: 'Recipient email address is missing.' };
  }

  if (isTestDomainEmail(targetRecipient)) {
    console.log(`[SHARE EMAIL - TEST BYPASS] Sender: ${getSmtpSenderEmail()} | Recipient: ${targetRecipient} | Test domain detected, skipping public SMTP network dispatch.`);
    return { success: true, messageId: `test-bypass-${Date.now()}`, accepted: [targetRecipient], rejected: [], response: '250 Test Bypass' };
  }

  if (!isSmtpConfigured()) {
    console.warn(`[SMTP WARN] Cannot send share notification to ${targetRecipient}: SMTP_USER or SMTP_PASS not set.`);
    return {
      success: false,
      error: 'SMTP credentials (SMTP_USER / SMTP_PASS) not configured on backend server.',
    };
  }

  try {
    const sender = getSmtpSenderEmail();
    const text = generateShareEmailText(input);
    const html = generateShareEmailHtml(input);

    const mailOptions = {
      from: `"FileVault AI" <${sender}>`,
      to: targetRecipient,
      replyTo: input.sharedByEmail ? input.sharedByEmail.trim() : sender,
      envelope: {
        from: sender,
        to: targetRecipient,
      },
      subject: `FileVault AI — A file has been shared with you`,
      text,
      html,
    };

    const info = await smtpTransport.sendMail(mailOptions);
    
    console.log(`\n==================================================`);
    console.log(`[SHARE EMAIL DEBUG]`);
    console.log(`Sender: ${sender}`);
    console.log(`Recipient: ${targetRecipient}`);
    console.log(`Envelope To: ${targetRecipient}`);
    console.log(`Accepted: ${JSON.stringify(info.accepted)}`);
    console.log(`Rejected: ${JSON.stringify(info.rejected)}`);
    console.log(`Response: ${info.response}`);
    console.log(`MessageId: ${info.messageId}`);
    console.log(`==================================================\n`);

    return {
      success: info.accepted.includes(targetRecipient) || info.accepted.length > 0,
      messageId: info.messageId,
      accepted: info.accepted.map(String),
      rejected: info.rejected.map(String),
      response: info.response,
    };
  } catch (error: any) {
    console.error(`[SMTP ERROR] Failed to send share notification to ${targetRecipient}:`, error.message);
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
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>FileVault AI — Verification Code</title>
</head>
<body style="margin:0; padding:20px; background-color:#f4f6f9; font-family:Arial, sans-serif; color:#1f2937;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px; margin:0 auto; background-color:#ffffff; border:1px solid #e5e7eb; border-radius:8px; overflow:hidden;">
    <tr>
      <td style="background-color:#2563eb; padding:20px 24px; text-align:left;">
        <h1 style="margin:0; font-size:20px; color:#ffffff; font-weight:bold;">FileVault AI</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:28px 24px;">
        <h2 style="margin:0 0 12px 0; font-size:16px; color:#111827;">Verification Code</h2>
        <p style="margin:0 0 20px 0; font-size:14px; color:#4b5563;">
          Use the 6-digit code below to complete your registration for <strong>${input.recipientEmail}</strong>:
        </p>

        <div style="text-align:center; margin:24px 0; background-color:#f3f4f6; border:1px solid #d1d5db; border-radius:6px; padding:16px;">
          <div style="font-size:32px; font-weight:bold; letter-spacing:8px; color:#1d4ed8;">${input.otp}</div>
          <div style="font-size:12px; color:#6b7280; margin-top:6px;">Expires in 5 minutes</div>
        </div>

        <p style="margin:0; font-size:12px; color:#9ca3af;">
          If you did not request this code, please ignore this email.
        </p>
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
  const targetRecipient = (input.recipientEmail || '').trim().toLowerCase();

  if (!targetRecipient) {
    return { success: false, error: 'Recipient email address is missing.' };
  }

  if (isTestDomainEmail(targetRecipient)) {
    console.log(`[OTP EMAIL - TEST BYPASS] Recipient: ${targetRecipient} | Test domain detected, skipping public SMTP network dispatch.`);
    return { success: true, messageId: `test-otp-bypass-${Date.now()}` };
  }

  if (!isSmtpConfigured()) {
    console.warn(`[SMTP WARN] Cannot send registration OTP to ${targetRecipient}: SMTP_USER or SMTP_PASS not set.`);
    return {
      success: false,
      error: 'SMTP credentials (SMTP_USER / SMTP_PASS) not configured on backend server.',
    };
  }

  try {
    const sender = getSmtpSenderEmail();
    const html = generateOtpEmailHtml(input);
    const text = `FileVault AI Verification Code\n\nYour 6-digit registration code is: ${input.otp}\nExpires in 5 minutes.`;

    const mailOptions = {
      from: `"FileVault AI" <${sender}>`,
      to: targetRecipient,
      envelope: {
        from: sender,
        to: targetRecipient,
      },
      subject: `FileVault AI — Registration Verification Code (${input.otp})`,
      text,
      html,
    };

    const info = await smtpTransport.sendMail(mailOptions);
    console.log(`[SMTP SUCCESS] Registration OTP email delivered to ${targetRecipient}. MessageId: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error(`[SMTP ERROR] Failed to send registration OTP email to ${targetRecipient}:`, error.message);
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
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>FileVault AI — Login Verification Code</title>
</head>
<body style="margin:0; padding:20px; background-color:#f4f6f9; font-family:Arial, sans-serif; color:#1f2937;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px; margin:0 auto; background-color:#ffffff; border:1px solid #e5e7eb; border-radius:8px; overflow:hidden;">
    <tr>
      <td style="background-color:#2563eb; padding:20px 24px; text-align:left;">
        <h1 style="margin:0; font-size:20px; color:#ffffff; font-weight:bold;">FileVault AI</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:28px 24px;">
        <h2 style="margin:0 0 12px 0; font-size:16px; color:#111827;">Login Verification Code</h2>
        <p style="margin:0 0 20px 0; font-size:14px; color:#4b5563;">
          Use the 6-digit MFA code below to log into your account <strong>${input.recipientEmail}</strong>:
        </p>

        <div style="text-align:center; margin:24px 0; background-color:#f3f4f6; border:1px solid #d1d5db; border-radius:6px; padding:16px;">
          <div style="font-size:32px; font-weight:bold; letter-spacing:8px; color:#1d4ed8;">${input.otp}</div>
          <div style="font-size:12px; color:#6b7280; margin-top:6px;">Expires in 5 minutes</div>
        </div>

        <p style="margin:0; font-size:12px; color:#9ca3af;">
          If you did not request this login attempt, please reset your password immediately.
        </p>
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
  const targetRecipient = (input.recipientEmail || '').trim().toLowerCase();

  if (!targetRecipient) {
    return { success: false, error: 'Recipient email address is missing.' };
  }

  if (isTestDomainEmail(targetRecipient)) {
    console.log(`[LOGIN OTP - TEST BYPASS] Recipient: ${targetRecipient} | Test domain detected, skipping public SMTP network dispatch.`);
    return { success: true, messageId: `test-login-bypass-${Date.now()}` };
  }

  if (!isSmtpConfigured()) {
    console.warn(`[SMTP WARN] Cannot send login OTP to ${targetRecipient}: SMTP_USER or SMTP_PASS not set.`);
    return {
      success: false,
      error: 'SMTP credentials (SMTP_USER / SMTP_PASS) not configured on backend server.',
    };
  }

  try {
    const sender = getSmtpSenderEmail();
    const html = generateLoginOtpEmailHtml(input);
    const text = `FileVault AI Login MFA Code\n\nYour 6-digit MFA login code is: ${input.otp}\nExpires in 5 minutes.`;

    const mailOptions = {
      from: `"FileVault AI" <${sender}>`,
      to: targetRecipient,
      envelope: {
        from: sender,
        to: targetRecipient,
      },
      subject: `FileVault AI — Login Verification Code (${input.otp})`,
      text,
      html,
    };

    const info = await smtpTransport.sendMail(mailOptions);
    console.log(`[SMTP SUCCESS] Login OTP email delivered to ${targetRecipient}. MessageId: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error(`[SMTP ERROR] Failed to send login OTP email to ${targetRecipient}:`, error.message);
    return {
      success: false,
      error: error.message || 'Failed to dispatch email via SMTP.',
    };
  }
}
