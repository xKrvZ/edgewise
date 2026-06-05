export default {
  from: process.env.EMAIL_FROM || 'noreply@dracade.com',
  fromName: process.env.EMAIL_FROM_NAME || 'Dracade',
  // For SMTP configuration
  smtp: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASSWORD || '',
    },
  },
  // For development: log emails to console instead of sending
  logOnly: process.env.EMAIL_LOG_ONLY === 'true' || process.env.NODE_ENV === 'local',
};
