import { customAlphabet } from 'nanoid';
import { generateMystery } from '../ai/mysteryGenerator.js';
import { processInvestigation, generateEpilogue } from '../ai/gameMaster.js';

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

    socket.on('investigateAction', async ({ actionText }, callback) => {
      const roomCode = socketToRoom.get(socket.id);
      if (!roomCode) return callback?.({ ok: false, error: 'Not in a room' });

      const room = rooms.get(roomCode);
      if (!room || room.phase !== 'game') return callback?.({ ok: false, error: 'Game not active' });

      const player = room.players.find(p => p.id === socket.id);
      if (!player || !player.character) return callback?.({ ok: false, error: 'Player character not found' });

      try {
        const result = await processInvestigation(player, actionText, room.mystery, room.discoveredClues.map(c => c.id));
        
        if (result.error) {
          return callback?.({ ok: false, error: result.error });
        }

        let newClue = null;
        if (result.matched_clue_id) {
          const clue = room.mystery.clues?.find(c => c.id === result.matched_clue_id);
          if (clue && !room.discoveredClues.some(c => c.id === clue.id)) {
            newClue = {
              id: clue.id,
              description: clue.description,
              discoveredBy: player.name,
              discoveredAt: Date.now()
            };
            room.discoveredClues.push(newClue);
            io.to(roomCode).emit('clueDiscovered', newClue);
          }
        }

        socket.emit('investigateResponse', {
          actionText,
          flavorText: result.flavor_text,
          clue: newClue
        });
        
        callback?.({ ok: true });
      } catch (err) {
        console.error("Investigate Action Error:", err);
        callback?.({ ok: false, error: "An error occurred during investigation." });
      }
    });

    socket.on('playerTyping', ({ isTyping }) => {
      const roomCode = socketToRoom.get(socket.id);
      if (!roomCode) return;
      const room = rooms.get(roomCode);
      if (!room) return;
      const player = room.players.find(p => p.id === socket.id);
      if (!player) return;
      
      // broadcast to everyone else in the room
      socket.to(roomCode).emit('playerTypingUpdate', {
        playerId: player.id,
        playerName: player.character?.character_name || player.name,
        isTyping
      });
    });

    socket.on('submitVote', async ({ accusedId, motive }, callback) => {
      const roomCode = socketToRoom.get(socket.id);
      if (!roomCode) return callback?.({ ok: false, error: 'Not in a room' });

      const room = rooms.get(roomCode);
      if (!room || room.phase !== 'game') return callback?.({ ok: false, error: 'Game not active' });
      
      const player = room.players.find(p => p.id === socket.id);
      if (!player) return callback?.({ ok: false, error: 'Player not found' });

      room.votes[socket.id] = { accusedId, motive, voterName: player.name };
      
      io.to(roomCode).emit('voteCast', { voterName: player.name });
      callback?.({ ok: true });

      // Check if all players have voted
      if (Object.keys(room.votes).length === room.players.length) {
        room.phase = 'reveal';
        // We don't just emit 'revealPhase' anymore. We compute results and generate epilogue.
        
        try {
          const murderer = room.mystery.players.find(p => p.is_murderer);
          const murdererId = room.players.find(p => p.character?.character_name === murderer.character_name)?.id;
          
          let maxVotes = 0;
          const voteCounts = {};
          const voteBreakdown = [];

          // Tally votes and build breakdown
          for (const [voterId, vote] of Object.entries(room.votes)) {
            voteCounts[vote.accusedId] = (voteCounts[vote.accusedId] || 0) + 1;
            if (voteCounts[vote.accusedId] > maxVotes) {
              maxVotes = voteCounts[vote.accusedId];
            }
            
            const accusedPlayer = room.players.find(p => p.id === vote.accusedId);
            voteBreakdown.push({
              voterName: vote.voterName,
              accusedName: accusedPlayer?.character?.character_name || accusedPlayer?.name || 'Unknown',
              motive: vote.motive
            });
          }

          // Check if murderer got the STRICT majority. If there's a tie for max votes, murderer escapes.
          const topVotedIds = Object.keys(voteCounts).filter(id => voteCounts[id] === maxVotes);
          const success = topVotedIds.length === 1 && topVotedIds[0] === murdererId;

          // Call the Game Master for the epilogue
          const epilogueText = await generateEpilogue(room.mystery, murderer, voteBreakdown, success);

          io.to(roomCode).emit('finalReveal', {
            trueMurdererId: murdererId,
            trueMurdererName: murderer.character_name,
            voteBreakdown,
            epilogueText,
            success
          });
        } catch (err) {
          console.error("Reveal Error:", err);
          io.to(roomCode).emit('gameError', { message: 'Failed to generate reveal.' });
        }
      }
    });

    socket.on('returnToLobby', (callback) => {
      const roomCode = socketToRoom.get(socket.id);
      if (!roomCode) return callback?.({ ok: false, error: 'Not in a room' });

      const room = rooms.get(roomCode);
      if (!room) return callback?.({ ok: false, error: 'Room not found' });
      
      // Only host can reset
      if (room.hostId !== socket.id) return callback?.({ ok: false, error: 'Only the host can return to lobby' });

      // STRICT STATE RESET FOR "PLAY AGAIN"
      room.phase = 'lobby';
      room.mystery = null;
      room.publicInfo = null;
      room.votes = {};
      room.discoveredClues = [];
      
      for (const player of room.players) {
        player.character = undefined;
      }

      io.to(roomCode).emit('playerListUpdate', {
        players: room.players.filter((p) => p.id),
        hostId: room.hostId,
      });
      io.to(roomCode).emit('gamePhase', { phase: 'lobby' });
      
      callback?.({ ok: true });
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
