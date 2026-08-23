import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET || 'super_secret_jwt_key_agentflow_ai_2026_secure',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  encryptionKey: process.env.CREDENTIAL_ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  mongoUri: process.env.MONGODB_URI || '',
  redisUrl: process.env.REDIS_URL || '',
  openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  oauth: {
    gmail: {
      clientId: process.env.GMAIL_CLIENT_ID || '',
      clientSecret: process.env.GMAIL_CLIENT_SECRET || '',
      redirectUri: process.env.GMAIL_REDIRECT_URI || 'http://localhost:5000/api/integrations/oauth/gmail/callback'
    },
    slack: {
      clientId: process.env.SLACK_CLIENT_ID || '',
      clientSecret: process.env.SLACK_CLIENT_SECRET || '',
      redirectUri: process.env.SLACK_REDIRECT_URI || 'http://localhost:5000/api/integrations/oauth/slack/callback'
    },
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID || '',
      clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
      botToken: process.env.DISCORD_BOT_TOKEN || '',
      redirectUri: process.env.DISCORD_REDIRECT_URI || 'http://localhost:5000/api/integrations/oauth/discord/callback'
    },
    googleSheets: {
      clientId: process.env.GOOGLE_SHEETS_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_SHEETS_CLIENT_SECRET || '',
      redirectUri: process.env.GOOGLE_SHEETS_REDIRECT_URI || 'http://localhost:5000/api/integrations/oauth/google-sheets/callback'
    }
  }
};
