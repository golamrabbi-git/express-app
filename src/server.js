import app from './app.js';
import config from './config/index.js';
import { connectDB, disconnectDB, syncIndexes } from './config/db.js';
import { ensureSuperAdmin } from './services/seed.service.js';

const start = async () => {
  try {
    await connectDB();
    await syncIndexes();
    await ensureSuperAdmin();
  } catch (err) {
    console.error(`Startup failed: ${err.message}`);
    process.exit(1);
  }

  const server = app.listen(config.port, () => {
    console.log(`Server running in ${config.env} mode on http://localhost:${config.port}`);
  });

  const shutdown = async () => {
    server.close();
    await disconnectDB();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

start();
