// In-memory game state. Fine for a hackathon — swap for Redis only if you
// end up needing multi-instance scaling (you almost certainly won't).
const rooms = new Map(); // roomCode -> { players: [], hostId, phase, ... }

export function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // --- Phase 0: connectivity test ---
    // Frontend emits 'ping', we respond with 'pong'. This is what proves
    // the "frontend + backend connected via Socket.io" deliverable.
    socket.on('ping', (payload) => {
      socket.emit('pong', { received: payload, at: Date.now() });
    });

    // --- Phase 1 stubs (Lobby System) ---
    // Fill these in next: create/join room, broadcast player list, etc.
    socket.on('createRoom', (playerName, callback) => {
      // TODO: generate room code (nanoid), create room, add player as host
      callback?.({ ok: false, error: 'Not implemented yet — Phase 1' });
    });

    socket.on('joinRoom', ({ roomCode, playerName }, callback) => {
      // TODO: validate room exists, add player, broadcast updated player list
      callback?.({ ok: false, error: 'Not implemented yet — Phase 1' });
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
      // TODO: remove player from their room, broadcast updated player list
    });
  });
}
