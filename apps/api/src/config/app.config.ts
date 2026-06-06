let config = {
  name: process.env.APP_NAME || 'app',
  domain: (process.env.APP_DOMAIN || 'localhost').replace(/\/$/, ''),
  port: parseInt(process.env.APP_PORT || '3001', 10) || 3000,
  secret: process.env.APP_SECRET || 'secret',
  environment: process.env.NODE_ENV || 'local',
  debug: ['local', 'development', 'test'].includes(process.env.NODE_ENV?.toLowerCase()),
  baseUrl: '',
  frontendUrl:
    process.env.APP_FRONTEND_URL ||
    process.env.FRONTEND_URL ||
    'http://localhost:3000',
};

if (config.port === 443) {
  config.baseUrl = `https://${config.domain}`;
} else {
  config.baseUrl = `http://${config.domain}${config.port != 80 ? `:${config.port}` : ''}`;
}

export default config;