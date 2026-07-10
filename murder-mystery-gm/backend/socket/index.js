import { customAlphabet } from 'nanoid';
import { generateMystery } from '../ai/mysteryGenerator.js';

// Simple Fisher-Yates shuffle helper
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}// In-memory game state. Fine for a hackathon — swap for Redis only if you
// end up needing multi-instance scaling (you almost certainly won't).
const rooms = new Map(); // roomCode -> { players: [], hostId, phase, ... }
const socketToRoom = new Map(); // socket.id -> roomCode

// Exclude ambiguous chars like 0, O, 1, I
const generateRoomCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 5);

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
      });
      socketToRoom.set(socket.id, roomCode);
      socket.join(roomCode);

      callback?.({ ok: true, roomCode, isHost: true, players: [newPlayer], hostId: socket.id });
    });

    socket.on('joinRoom', ({ roomCode, playerName }, callback) => {
      roomCode = roomCode?.trim().toUpperCase();
      playerName = playerName?.trim();

      if (!roomCode || !playerName) return callback?.({ ok: false, error: 'Room code and player name are required' });

      const room = rooms.get(roomCode);
      if (!room) return callback?.({ ok: false, error: 'Room not found' });
      if (room.phase !== 'lobby') return callback?.({ ok: false, error: 'Game already started' });
      
      // Case-insensitive name uniqueness check
      if (room.players.some(p => p.name.toLowerCase() === playerName.toLowerCase())) {
        return callback?.({ ok: false, error: 'Name already taken in this room' });
      }

      const newPlayer = { id: socket.id, name: playerName };
      room.players.push(newPlayer);
      socketToRoom.set(socket.id, roomCode);
      socket.join(roomCode);

      // Broadcast to everyone in the room (including the joiner, to keep everything synced if needed, but ack has it too)
      io.to(roomCode).emit('playerListUpdate', { players: room.players, hostId: room.hostId });
      callback?.({ ok: true, roomCode, isHost: false, players: room.players, hostId: room.hostId });
    });

    socket.on('startGame', async (callback) => {
      const roomCode = socketToRoom.get(socket.id);
      if (!roomCode) return callback?.({ ok: false, error: 'Not in a room' });

      const room = rooms.get(roomCode);
      if (!room) return callback?.({ ok: false, error: 'Room not found' });
      if (room.hostId !== socket.id) return callback?.({ ok: false, error: 'Only the host can start the game' });
      if (room.players.length < 3) return callback?.({ ok: false, error: 'Need at least 3 players to start' });
      if (room.phase !== 'lobby') return callback?.({ ok: false, error: 'Game is already starting or running' });

      room.phase = 'generating';
      io.to(roomCode).emit('gameStarted', { phase: 'generating' });
      callback?.({ ok: true });

      try {
        const mystery = await generateMystery(room.players.length);
        room.mystery = mystery;
        room.discoveredClues = [];
        room.accusations = [];
        room.votes = {};
        
        // Randomly shuffle the generated characters so it's not based on join order
        const shuffledCharacters = shuffleArray(mystery.players);
        
        // Assign one character to each player
        for (let i = 0; i < room.players.length; i++) {
          const player = room.players[i];
          const char = shuffledCharacters[i];
          
          player.character = char; // Store server-side
          
          // Send private scrubbed data to the client
          const scrubbedChar = {
            character_name: char.character_name,
            public_bio: char.public_bio,
            private_bio: char.private_bio,
            personal_objective: char.personal_objective,
            hidden_information: char.hidden_information,
            secrets: char.secrets.map(s => s.content), // Only send the content, no metadata needed on client right now
            relationships: char.relationships,
            alibi_claimed: char.alibi_claimed
          };
          
          io.to(player.id).emit('characterAssigned', scrubbedChar);
        }
        
        console.log("✅ Mystery generated successfully!");
        room.phase = 'investigation';
        io.to(roomCode).emit('gameStarted', { 
          phase: 'investigation',
          caseInfo: {
            title: mystery.case_title,
            victim: mystery.victim?.name,
            location: mystery.setting
          }
        });

      } catch (err) {
        console.error(`[${roomCode}] Mystery generation failed:`, err);
        room.phase = 'lobby';
        io.to(roomCode).emit('gameError', { message: 'Failed to generate mystery. The AI Game Master stumbled. Please try again.' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
      const roomCode = socketToRoom.get(socket.id);
      if (roomCode) {
        socketToRoom.delete(socket.id);
        const room = rooms.get(roomCode);
        if (room) {
          room.players = room.players.filter(p => p.id !== socket.id);
          
          if (room.players.length === 0) {
            rooms.delete(roomCode);
            console.log(`🧹 Room ${roomCode} deleted (empty)`);
          } else {
            // Reassign host if the host left
            if (room.hostId === socket.id) {
              room.hostId = room.players[0].id;
              console.log(`👑 Room ${roomCode} new host: ${room.hostId}`);
            }
            io.to(roomCode).emit('playerListUpdate', { players: room.players, hostId: room.hostId });
          }
        }
      }
    });
  });
}
