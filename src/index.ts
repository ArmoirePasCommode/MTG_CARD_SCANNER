import dotenv from 'dotenv';
dotenv.config();
import { loadEnvFromSecretIfConfigured } from './server/utils/secretEnv.js';

async function main() {
  await loadEnvFromSecretIfConfigured();
  const { app } = await import('./server/app.js');
  const port = Number(process.env.PORT || 8080);
  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
}

main();
