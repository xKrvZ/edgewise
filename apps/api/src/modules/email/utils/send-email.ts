import emailConfig from '@/config/email.config';

interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Simple email sending utility that can be used outside of NestJS context
 * In development, it logs emails to console. In production, implement actual email sending.
 */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const { to, subject, text, html } = options;

  // If logOnly is enabled (development), just log the email
  if (emailConfig.logOnly) {
    console.log('📧 Email (log only mode):');
    console.log(`To: ${to}`);
    console.log(`From: ${emailConfig.fromName} <${emailConfig.from}>`);
    console.log(`Subject: ${subject}`);
    if (text) {
      console.log(`Text:\n${text}`);
    }
    if (html) {
      console.log(`HTML:\n${html.substring(0, 500)}${html.length > 500 ? '...' : ''}`);
    }
    return;
  }

  // TODO: Implement actual email sending using nodemailer, SendGrid, AWS SES, etc.
  // For now, this is a placeholder
  console.warn('⚠️ Email sending not yet implemented. Email would be sent to:', to);
  console.warn('Subject:', subject);
  
  // Example implementation with nodemailer (uncomment and configure):
  // import nodemailer from 'nodemailer';
  // const transporter = nodemailer.createTransport({
  //   host: emailConfig.smtp.host,
  //   port: emailConfig.smtp.port,
  //   secure: emailConfig.smtp.secure,
  //   auth: emailConfig.smtp.auth.user ? emailConfig.smtp.auth : undefined,
  // });
  // await transporter.sendMail({
  //   from: `"${emailConfig.fromName}" <${emailConfig.from}>`,
  //   to,
  //   subject,
  //   text,
  //   html,
  // });
}
