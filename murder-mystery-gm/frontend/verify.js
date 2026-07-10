import { io } from 'socket.io-client';

const URL = 'http://localhost:4000';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('--- STARTING E2E LOBBY TEST ---');
  
  const p1 = io(URL);
  const p2 = io(URL);
  const p3 = io(URL);

  await delay(500);

  let roomCode = '';

  // 1. Create Game
  const createRes = await new Promise(resolve => {
    p1.emit('createRoom', 'Alice', resolve);
  });
  
  if (createRes.ok && createRes.isHost && createRes.players.length === 1) {
    console.log('✅ p1 created room successfully:', createRes.roomCode);
    roomCode = createRes.roomCode;
  } else {
    console.error('❌ Failed to create room:', createRes);
    process.exit(1);
  }

  // 2. Join Game (P2)
  const joinRes2 = await new Promise(resolve => {
    p2.emit('joinRoom', { roomCode, playerName: 'Bob' }, resolve);
  });

  if (joinRes2.ok && !joinRes2.isHost && joinRes2.players.length === 2) {
    console.log('✅ p2 joined room successfully. Players:', joinRes2.players.map(p => p.name));
  } else {
    console.error('❌ p2 failed to join:', joinRes2);
    process.exit(1);
  }

  // 3. Name uniqueness validation
  const joinResDuplicate = await new Promise(resolve => {
    p3.emit('joinRoom', { roomCode, playerName: 'bob' }, resolve);
  });

  if (!joinResDuplicate.ok && joinResDuplicate.error === 'Name already taken in this room') {
    console.log('✅ p3 correctly rejected for duplicate name (case-insensitive).');
  } else {
    console.error('❌ duplicate name validation failed:', joinResDuplicate);
    process.exit(1);
  }

  // 4. Join Game (P3)
  const joinRes3 = await new Promise(resolve => {
    p3.emit('joinRoom', { roomCode, playerName: 'Charlie' }, resolve);
  });

  if (joinRes3.ok && joinRes3.players.length === 3) {
    console.log('✅ p3 joined room successfully. Players:', joinRes3.players.map(p => p.name));
  } else {
    console.error('❌ p3 failed to join:', joinRes3);
    process.exit(1);
  }

  // 5. Non-host start attempt
  const nonHostStartRes = await new Promise(resolve => {
    p2.emit('startGame', resolve);
  });

  if (!nonHostStartRes.ok) {
    console.log('✅ non-host correctly prevented from starting game.');
  } else {
    console.error('❌ non-host was able to start game:', nonHostStartRes);
    process.exit(1);
  }

  // 6. Start Game (P1, the host)
  const startRes = await new Promise(resolve => {
    p1.emit('startGame', resolve);
  });

  if (startRes.ok) {
    console.log('✅ host started game successfully.');
  } else {
    console.error('❌ host failed to start game:', startRes);
    process.exit(1);
  }

  // 7. Late join attempt
  const p4 = io(URL);
  await delay(200);
  const joinRes4 = await new Promise(resolve => {
    p4.emit('joinRoom', { roomCode, playerName: 'Dave' }, resolve);
  });

  if (!joinRes4.ok && joinRes4.error === 'Game already started') {
    console.log('✅ late join correctly rejected because phase = generating.');
  } else {
    console.error('❌ late join allowed when it should not have been:', joinRes4);
    process.exit(1);
  }

  console.log('--- ALL TESTS PASSED ---');
  process.exit(0);
}

runTest().catch(console.error);
