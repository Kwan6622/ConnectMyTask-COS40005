const { Server } = require('socket.io');

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH'],
    },
  });

  io.on('connection', (socket) => {
    // eslint-disable-next-line no-console
    console.log('Client connected to Socket.io', socket.id);

    socket.on('disconnect', () => {
      // eslint-disable-next-line no-console
      console.log('Client disconnected from Socket.io', socket.id);
    });
  });
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io has not been initialized');
  }
  return io;
}

module.exports = { initSocket, getIO };

