import { customAlphabet } from 'nanoid';
import { generateMystery } from '../ai/mysteryGenerator.js';

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const rooms = new Map();
const socketToRoom = new Map();

const generateRoomCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 5);
const MIN_PLAYERS = 3;

function scrubCharacter(char) {
  return {
    character_name: char.character_name,
    public_bio: char.public_bio,
    private_bio: char.private_bio,
    personal_objective: char.personal_objective,
    hidden_information: char.hidden_information,
    secrets: char.secrets.map((s) => (typeof s === 'string' ? s : s.content)),
    relationships: char.relationships,
    alibi_claimed: char.alibi_claimed,
  };
}

function buildPublicInfo(mystery) {
  return {
    title: mystery.case_title,
    victim: mystery.victim?.name,
    location: mystery.setting,
    round: 1,
    totalRounds: 3,
  };
}

function assignCharacters(room, mystery) {
  const shuffledCharacters = shuffleArray(mystery.players);

  for (let i = 0; i < room.players.length; i++) {
    const player = room.players[i];
    const char = shuffledCharacters[i];
    player.character = char;
  }
}

function emitMysteryToRoom(io, roomCode, room) {
  const publicInfo = room.publicInfo;

  io.to(roomCode).emit('mysteryReady', { publicInfo });

  for (const player of room.players) {
    if (player.character) {
      io.to(player.id).emit('yourCharacter', scrubCharacter(player.character));
    }
  }
}

function findPlayerByName(room, playerName) {
  const normalized = playerName.trim().toLowerCase();
  return room.players.find((p) => p.name.toLowerCase() === normalized);
}

export function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on('ping', (payload) => {
      socket.emit('pong', { received: payload, at: Date.now() });
    });

    socket.on('createRoom', (playerName, callback) => {
      playerName = playerName?.trim();
      if (!playerName) return callback?.({ ok: false, error: 'Player name is required' });

      const roomCode = generateRoomCode();
      const newPlayer = { id: socket.id, name: playerName };

      rooms.set(roomCode, {
        hostId: socket.id,
        phase: 'lobby',
        players: [newPlayer],
        publicInfo: null,
        mystery: null,
      });
      socketToRoom.set(socket.id, roomCode);
      socket.join(roomCode);

      callback?.({ ok: true, roomCode, isHost: true, players: [newPlayer], hostId: socket.id });
    });

    socket.on('joinRoom', ({ roomCode, playerName }, callback) => {
      roomCode = roomCode?.trim().toUpperCase();
      playerName = playerName?.trim();

      if (!roomCode || !playerName) {
        return callback?.({ ok: false, error: 'Room code and player name are required' });
      }

      const room = rooms.get(roomCode);
      if (!room) return callback?.({ ok: false, error: 'Room not found' });
      if (room.phase !== 'lobby') {
        return callback?.({ ok: false, error: 'Game already started' });
      }

      if (room.players.some((p) => p.name.toLowerCase() === playerName.toLowerCase())) {
        return callback?.({ ok: false, error: 'Name already taken in this room' });
      }

      const newPlayer = { id: socket.id, name: playerName };
      room.players.push(newPlayer);
      socketToRoom.set(socket.id, roomCode);
      socket.join(roomCode);

      io.to(roomCode).emit('playerListUpdate', { players: room.players, hostId: room.hostId });
      callback?.({ ok: true, roomCode, isHost: false, players: room.players, hostId: room.hostId });
    });

    socket.on('rejoinGame', ({ roomCode, playerName }, callback) => {
      roomCode = roomCode?.trim().toUpperCase();
      playerName = playerName?.trim();

      const room = rooms.get(roomCode);
      if (!room) return callback?.({ ok: false, error: 'Room not found' });

      const existing = findPlayerByName(room, playerName);
      if (!existing) return callback?.({ ok: false, error: 'Player not found in room' });

      existing.id = socket.id;
      socketToRoom.set(socket.id, roomCode);
      socket.join(roomCode);

      const response = {
        ok: true,
        roomCode,
        players: room.players,
        hostId: room.hostId,
        phase: room.phase,
        publicInfo: room.publicInfo ?? undefined,
      };

      callback?.(response);

      if (room.phase === 'loading') {
        io.to(roomCode).emit('playerListUpdate', { players: room.players, hostId: room.hostId });
        return;
      }

      if (room.phase === 'game' && room.publicInfo) {
        socket.emit('mysteryReady', { publicInfo: room.publicInfo });
        if (existing.character) {
          socket.emit('yourCharacter', scrubCharacter(existing.character));
        }
      }
    });

    socket.on('startGame', async ({ roomCode: clientRoomCode }, callback) => {
      const roomCode = socketToRoom.get(socket.id) ?? clientRoomCode?.trim().toUpperCase();
      if (!roomCode) return callback?.({ ok: false, error: 'Not in a room' });

      const room = rooms.get(roomCode);
      if (!room) return callback?.({ ok: false, error: 'Room not found' });
      if (room.hostId !== socket.id) {
        return callback?.({ ok: false, error: 'Only the host can start the game' });
      }
      if (room.players.length < MIN_PLAYERS) {
        return callback?.({ ok: false, error: `Need at least ${MIN_PLAYERS} players to start` });
      }
      if (room.phase !== 'lobby') {
        return callback?.({ ok: false, error: 'Game is already starting or running' });
      }

      room.phase = 'loading';
      io.to(roomCode).emit('gamePhase', { phase: 'loading' });
      callback?.({ ok: true });

      try {
        const mystery = await generateMystery(room.players.length);
        room.mystery = mystery;
        room.discoveredClues = [];
        room.accusations = [];
        room.votes = {};
        room.publicInfo = buildPublicInfo(mystery);

        assignCharacters(room, mystery);
        room.phase = 'game';

        emitMysteryToRoom(io, roomCode, room);
        console.log(`✅ Mystery generated for room ${roomCode}`);
      } catch (err) {
        console.error(`[${roomCode}] Mystery generation failed:`, err);
        room.phase = 'lobby';
        room.publicInfo = null;
        room.mystery = null;
        for (const player of room.players) {
          player.character = undefined;
        }
        io.to(roomCode).emit('gameError', {
          message: 'Failed to generate mystery. Please try again.',
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
      const roomCode = socketToRoom.get(socket.id);
      if (roomCode) {
        socketToRoom.delete(socket.id);
        const room = rooms.get(roomCode);
        if (room) {
          const disconnected = room.players.find((p) => p.id === socket.id);
          if (disconnected) {
            disconnected.id = null;
          } else {
            room.players = room.players.filter((p) => p.id !== socket.id);
          }

          if (room.players.length === 0) {
            rooms.delete(roomCode);
            console.log(`🧹 Room ${roomCode} deleted (empty)`);
          } else if (room.phase === 'lobby') {
            room.players = room.players.filter((p) => p.id !== null);
            if (room.hostId === socket.id) {
              room.hostId = room.players[0]?.id;
              console.log(`👑 Room ${roomCode} new host: ${room.hostId}`);
            }
            io.to(roomCode).emit('playerListUpdate', {
              players: room.players.filter((p) => p.id),
              hostId: room.hostId,
            });
          }
        }
      }
    });
  });
}
