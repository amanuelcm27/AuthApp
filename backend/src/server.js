import { createApp } from './app.js';
import { config } from './config.js';
import { ensureSeedData } from './store/memoryStore.js';

const app = createApp();

async function startServer() {
  await ensureSeedData();

  app.listen(config.port, () => {
    console.log(`Auth API listening on ${config.apiBaseUrl}`);
  });
}

startServer().catch(error => {
  console.error('Failed to start Auth API', error);
  process.exit(1);
});
