// Ensure required env vars exist during tests (CommonJS to avoid ESM/TS transform issues)
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '15m';
process.env.REFRESH_TOKEN_EXPIRES_IN = '30d';
process.env.GCP_PROJECT_ID = 'test-project';
process.env.GCS_BUCKET = 'test-bucket';
process.env.NODE_ENV = 'test';


