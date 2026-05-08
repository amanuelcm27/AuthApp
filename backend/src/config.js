import 'dotenv/config';

const env = process.env;

export const config = {
  nodeEnv: env.NODE_ENV ?? 'development',
  port: Number(env.PORT ?? 4000),
  clientUrl: env.CLIENT_URL ?? 'http://localhost:5173',
  apiBaseUrl: env.API_BASE_URL ?? 'http://localhost:4000',
  jwtAccessSecret: env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me',
  jwtRefreshSecret: env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret-change-me',
  jwtStateSecret: env.JWT_STATE_SECRET ?? 'dev-state-secret-change-me',
  googleClientId: env.GOOGLE_CLIENT_ID ?? '',
  googleClientSecret: env.GOOGLE_CLIENT_SECRET ?? '',
  googleRedirectUri: env.GOOGLE_REDIRECT_URI ?? 'http://localhost:4000/auth/google/callback'
};
