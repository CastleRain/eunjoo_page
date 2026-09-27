import 'dotenv/config';
import { createApp } from './bootstrap';

async function main() {
  const app = await createApp();
  const port = Number(process.env.PORT || 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be a valid port number');
  await app.listen(port, process.env.HOST || '127.0.0.1');
}

main().catch(() => {
  console.error('API startup failed. Check server configuration.');
  process.exitCode = 1;
});
