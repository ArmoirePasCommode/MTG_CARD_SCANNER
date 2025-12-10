import 'dotenv/config';

const defaultPort = process.env.PORT || '8080';
const deployedUrl = 'https://mtg-card-scanner-477210.oa.r.appspot.com';
const baseUrl =
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  process.env.BACKEND_URL ||
  deployedUrl ||
  `http://localhost:${defaultPort}`;
const healthPath = process.env.BACKEND_HEALTH_PATH || '/test';

const ensureLeadingSlash = (path) => (path.startsWith('/') ? path : `/${path}`);
const endpoint = `${baseUrl}${ensureLeadingSlash(healthPath)}`;

async function main() {
  console.log(`Checking backend connectivity at ${endpoint} ...`);
  try {
    const response = await fetch(endpoint, { method: 'GET' });
    const bodyText = await response.text();
    if (!response.ok) {
      throw new Error(`Received status ${response.status}: ${bodyText}`);
    }
    console.log('Backend reachable ✅');
    try {
      const json = JSON.parse(bodyText);
      console.log('Response JSON:', json);
    } catch {
      console.log('Response body:', bodyText);
    }
  } catch (error) {
    console.error('Backend check failed ❌');
    console.error(error?.message || error);
    process.exitCode = 1;
  }
}

main();

