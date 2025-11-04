import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

function parseDotenv(content: string): Record<string, string> {
  const envs: Record<string, string> = {};
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    envs[key] = value;
  });
  return envs;
}

export async function loadEnvFromSecretIfConfigured(): Promise<void> {
  const secretName = process.env.ENV_SECRET_NAME;
  const projectId = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
  if (!secretName || !projectId) return;
  try {
    const client = new SecretManagerServiceClient();
    const [access] = await client.accessSecretVersion({
      name: `projects/${projectId}/secrets/${secretName}/versions/latest`,
    });
    const payload = access.payload?.data?.toString('utf8') || '';
    const parsed = parseDotenv(payload);
    for (const [k, v] of Object.entries(parsed)) {
      if (process.env[k] === undefined) {
        process.env[k] = v;
      }
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Warning: failed to load env from Secret Manager:', (e as Error).message);
  }
}


