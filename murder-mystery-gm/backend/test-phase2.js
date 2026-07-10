import { io } from 'socket.io-client';

const URL = 'http://localhost:4000';
const NUM_PLAYERS = 4;

async function runTest() {
  console.log(`Starting Phase 2 E2E Test with ${NUM_PLAYERS} players...`);
  
  const sockets = Array.from({ length: NUM_PLAYERS }, () => io(URL));
  const charactersReceived = [];
  
  // 1. First player creates room
  const hostSocket = sockets[0];
  const roomCode = await new Promise(resolve => {
    hostSocket.emit('createRoom', 'HostPlayer', (res) => resolve(res.roomCode));
  });
  console.log(`Room created: ${roomCode}`);
  
  // 2. Others join
  for (let i = 1; i < NUM_PLAYERS; i++) {
    await new Promise(resolve => {
      sockets[i].emit('joinRoom', { roomCode, playerName: `Player${i}` }, resolve);
    });
  }
  console.log('All players joined.');

  // 3. Listen for characterAssigned
  const characterPromises = sockets.map(socket => {
    return new Promise(resolve => {
      socket.on('characterAssigned', (char) => {
        charactersReceived.push(char);
        resolve();
      });
    });
  });

  // 4. Start game
  console.log('Starting game (waiting for LLM generation)...');
  hostSocket.emit('startGame');

  // Wait for all to receive characters
  await Promise.all(characterPromises);
  
  console.log('All characters received! Validating payloads...');
  
  // Validation
  let hasError = false;
  
  const characterNames = new Set(charactersReceived.map(c => c.character_name));
  if (characterNames.size !== NUM_PLAYERS) {
    console.error(`❌ Expected ${NUM_PLAYERS} unique characters, got ${characterNames.size}`);
    hasError = true;
  }
  
  for (const char of charactersReceived) {
    if ('is_murderer' in char) {
      console.error(`❌ Leak detected! is_murderer was sent for ${char.character_name}`);
      hasError = true;
    }
    if ('true_whereabouts' in char) {
      console.error(`❌ Leak detected! true_whereabouts was sent for ${char.character_name}`);
      hasError = true;
    }
  }

  if (hasError) {
    console.error('❌ Test Failed due to leaks or invalid payloads.');
    process.exit(1);
  } else {
    console.log('✅ Test Passed! Payloads are unique and scrubbed of sensitive info.');
    console.log('Character names assigned: ', Array.from(characterNames).join(', '));
    process.exit(0);
  }
}

// Give the server a moment to boot if we're running them together
setTimeout(runTest, 1000);
