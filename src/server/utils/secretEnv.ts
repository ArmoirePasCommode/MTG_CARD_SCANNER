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
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
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
    const bytes = access.payload?.data as Uint8Array | undefined;
    let payload = bytes ? Buffer.from(bytes).toString('utf8') : '';
    // Strip potential UTF-8 BOM to avoid leading invisible char in first key
    if (payload.charCodeAt(0) === 0xfeff) {
      payload = payload.slice(1);
    }
    const parsed = parseDotenv(payload);
    for (const [k, v] of Object.entries(parsed)) {
      // Prevent overwriting credentials with a local file path that doesn't exist
      if (k === 'GOOGLE_APPLICATION_CREDENTIALS') continue;

      if (process.env[k] === undefined) {
        process.env[k] = v;
      }
    }
  } catch (e) {
    console.warn('Warning: failed to load env from Secret Manager:', (e as Error).message);
  }
}
