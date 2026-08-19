import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);
const SMTP_SECURE = process.env.SMTP_SECURE !== 'false'; // true for port 465, false for 587
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';

export function isSmtpConfigured(): boolean {
  return Boolean(SMTP_USER && SMTP_PASS);
}

export function getSmtpSenderEmail(): string {
  return SMTP_USER || 'no-reply@filevault-ai.local';
}

export const smtpTransport = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export async function verifySmtpConnection(): Promise<{ success: boolean; error?: string }> {
  if (!isSmtpConfigured()) {
    return { success: false, error: 'SMTP credentials (SMTP_USER / SMTP_PASS) not configured.' };
  }

  try {
    await smtpTransport.verify();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'SMTP connection verification failed.' };
  }
}
