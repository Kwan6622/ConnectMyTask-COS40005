const http = require('http');
const app = require('./app');
const { initSocket } = require('./shared/socket');
const { env } = require('./config/env');

const PORT = env.PORT || 4000;

async function start() {
  const server = http.createServer(app);

  // Initialize Socket.io on top of HTTP server
  initSocket(server);

  server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`ConnectMyTask API listening on port ${PORT}`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server', err);
  process.exit(1);
});

