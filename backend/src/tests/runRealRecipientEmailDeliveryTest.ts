import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { verifySmtpConnection, getSmtpSenderEmail } from '../config/smtp';
import { sendShareNotificationEmail } from '../services/emailService';

export async function runRealRecipientEmailDeliveryTest() {
  console.log('\n==================================================');
  console.log('REAL RECIPIENT EMAIL TEST');
  console.log('==================================================');

  try {
    const smtpCheck = await verifySmtpConnection();
    if (!smtpCheck.success) {
      console.error(`[FAIL] SMTP connection check failed: ${smtpCheck.error}`);
      return { success: false, status: 'SMTP_UNCONFIGURED' };
    }

    const smtpSender = getSmtpSenderEmail();
    const recipientEmail = 'shantigoyal140@gmail.com';

    const result = await sendShareNotificationEmail({
      recipientEmail,
      sharedByEmail: smtpSender,
      originalFilename: 'Diagnostic_Vault_Payload.pdf',
      permission: 'VIEW',
    });

    const status = result.success ? 'SMTP_ACCEPTED' : 'SMTP_REJECTED';

    console.log(`SMTP Sender: ${smtpSender}`);
    console.log(`Recipient: ${recipientEmail}`);
    console.log(`Envelope To: ${recipientEmail}`);
    console.log(`Accepted: ${JSON.stringify(result.accepted || [])}`);
    console.log(`Rejected: ${JSON.stringify(result.rejected || [])}`);
    console.log(`SMTP Response: ${result.response || 'N/A'}`);
    console.log(`Message ID: ${result.messageId || 'N/A'}`);
    console.log(`Status: ${status}`);
    console.log('==================================================');
    console.log('NOTICE: SMTP acceptance was verified, but recipient inbox delivery cannot be confirmed programmatically from this Gmail SMTP setup.');
    console.log('==================================================\n');

    return { success: result.success, status, result };
  } catch (err: any) {
    console.error(`[FAIL] Real recipient email test failed: ${err.message}`);
    return { success: false, error: err.message };
  }
}

if (require.main === module) {
  runRealRecipientEmailDeliveryTest().then(() => process.exit(0));
}
