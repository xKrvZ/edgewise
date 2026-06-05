import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import emailConfig from '@/config/email.config';

interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly config = emailConfig;

  async sendEmail(options: SendEmailOptions): Promise<void> {
    const { to, subject, text, html } = options;

    // If logOnly is enabled (development), just log the email
    if (this.config.logOnly) {
      this.logger.log('Email (log only mode):');
      this.logger.log(`To: ${to}`);
      this.logger.log(`Subject: ${subject}`);
      this.logger.log(`Text: ${text || 'N/A'}`);
      if (html) {
        this.logger.log(`HTML: ${html.substring(0, 200)}...`);
      }
      return;
    }

    // TODO: Implement actual email sending using SMTP or email service
    // For now, we'll use nodemailer or another email library
    // This is a placeholder that should be replaced with actual email sending logic
    this.logger.warn('Email sending not yet implemented. Email would be sent to:', to);
    this.logger.warn('Subject:', subject);
    
    // In production, you would use nodemailer or a service like SendGrid, AWS SES, etc.
    // Example with nodemailer:
    // const transporter = nodemailer.createTransport({...});
    // await transporter.sendMail({ from: this.config.from, to, subject, text, html });
  }
}
