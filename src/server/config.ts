import dotenv from 'dotenv';

dotenv.config();

function requireEnv(name: string, optional = false): string | undefined {
  const value = process.env[name];
  if (!value && !optional) {
    throw new Error(`Missing required env var ${name}`);
  }
  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || '8080',
  JWT_SECRET: requireEnv('JWT_SECRET') as string,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',
  GCP_PROJECT_ID: requireEnv('GCP_PROJECT_ID', true),
  GCS_BUCKET: requireEnv('GCS_BUCKET') as string,
};


