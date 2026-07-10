import { useEffect, useRef, useState } from 'react';
import { socket } from './socket';
import { Skull, UserPlus, LogIn, AlertCircle } from 'lucide-react';
import LobbyScreen from './LobbyScreen';
import LoadingMystery from './LoadingMystery';
import GameScreen from './GameScreen';
import AdminTest from './AdminTest';

const MIN_PLAYERS = 3;
const START_TIMEOUT_MS = 30_000;

/** @typedef {'home' | 'lobby' | 'loading' | 'game'} Phase */

// ─── Placeholder data for #demo mode ───────────────────────────────────────
const DEMO_PLAYERS = [
  { id: 'host', name: 'Detective Hale', isHost: true },
  { id: 'you', name: 'Margaret Ashford', isHost: false },
  { id: 'p3', name: 'Dr. Whitmore', isHost: false },
];

const DEMO_PUBLIC_INFO = {
  title: 'Death at Thornfield Manor',
  victim: 'Lord Reginald Thornfield',
  location: 'Thornfield Manor — the east library',
  round: 1,
  totalRounds: 3,
  timeLabel: 'Midnight, October 31st',
};

const DEMO_CHARACTER = {
  name: 'Margaret Ashford',
  background:
    'You are the manor\'s long-serving housekeeper, privy to every corridor and closet. Lord Thornfield trusted you with keys to rooms others never entered.',
  secret:
    'You witnessed Lord Thornfield arguing with an unknown guest in the library an hour before the body was discovered. You hid in the pantry rather than intervene.',
  motive:
    'Lord Thornfield was planning to sell the estate and dismiss the entire staff within the month.',
};

/**
 * Standalone demo — cycles lobby → loading → game with placeholder data.
 * Open with #demo in the URL hash.
 */
function AppDemo() {
  /** @type {[Phase, React.Dispatch<React.SetStateAction<Phase>>]} */
  const [phase, setPhase] = useState('lobby');
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState('');

  const handleStartGame = () => {
    setError('');
    setIsStarting(true);

    setTimeout(() => {
      setIsStarting(false);
      setPhase('loading');
    }, 1200);

    setTimeout(() => {
      setPhase('game');
    }, 4500);
  };

  if (phase === 'game') {
    return <GameScreen publicInfo={DEMO_PUBLIC_INFO} character={DEMO_CHARACTER} />;
  }

  if (phase === 'loading') {
    return <LoadingMystery />;
  }

  return (
    <LobbyScreen
      players={DEMO_PLAYERS}
      currentUserId="host"
      isHost={true}
      roomCode="THORN"
      minPlayers={MIN_PLAYERS}
      onStartGame={handleStartGame}
      isStarting={isStarting}
      error={error}
    />
  );
}

/**
 * Live multiplayer app — home screen, socket room flow, and Phase 2 screens.
 */
function AppLive() {
  /** @type {[Phase, React.Dispatch<React.SetStateAction<Phase>>]} */
  const [phase, setPhase] = useState('home');
  const [playerName, setPlayerName] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [error, setError] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  const [currentRoom, setCurrentRoom] = useState('');
  const [players, setPlayers] = useState([]);
  const [hostId, setHostId] = useState('');
  const [publicInfo, setPublicInfo] = useState(null);
  const [myCharacter, setMyCharacter] = useState(null);

  const startTimeoutRef = useRef(null);
  const pendingPublicRef = useRef(null);
  const pendingCharacterRef = useRef(null);

  const clearStartTimeout = () => {
    if (startTimeoutRef.current) {
      clearTimeout(startTimeoutRef.current);
      startTimeoutRef.current = null;
    }
  };

  const resetPendingMystery = () => {
    pendingPublicRef.current = null;
    pendingCharacterRef.current = null;
    setPublicInfo(null);
    setMyCharacter(null);
  };

  const tryEnterGame = () => {
    if (pendingPublicRef.current && pendingCharacterRef.current) {
      setPublicInfo(pendingPublicRef.current);
      setMyCharacter(pendingCharacterRef.current);
      setPhase('game');
      setIsStarting(false);
      clearStartTimeout();
    }
  };

  const persistSession = (roomCode, name) => {
    sessionStorage.setItem('murder_room', JSON.stringify({ roomCode, playerName: name }));
  };

  const clearSession = () => {
    sessionStorage.removeItem('murder_room');
  };

  useEffect(() => {
    function onPlayerListUpdate({ players: updatedPlayers, hostId: updatedHostId }) {
      setPlayers(updatedPlayers);
      setHostId(updatedHostId);
    }

    function onGamePhase({ phase: nextPhase }) {
      if (nextPhase === 'loading') {
        setPhase('loading');
        resetPendingMystery();
      }
    }

    function onMysteryReady({ publicInfo: info }) {
      pendingPublicRef.current = info;
      tryEnterGame();
    }

    function onYourCharacter(character) {
      pendingCharacterRef.current = character;
      tryEnterGame();
    }

    function onGameError({ message }) {
      setError(message);
      setIsStarting(false);
      setPhase('lobby');
      resetPendingMystery();
      clearStartTimeout();
    }

    socket.on('playerListUpdate', onPlayerListUpdate);
    socket.on('gamePhase', onGamePhase);
    socket.on('mysteryReady', onMysteryReady);
    socket.on('yourCharacter', onYourCharacter);
    socket.on('gameError', onGameError);

    const attemptRejoin = () => {
      const raw = sessionStorage.getItem('murder_room');
      if (!raw) return;

      try {
        const { roomCode, playerName: savedName } = JSON.parse(raw);
        socket.emit('rejoinGame', { roomCode, playerName: savedName }, (res) => {
          if (!res?.ok) {
            clearSession();
            return;
          }

          setCurrentRoom(res.roomCode);
          setPlayers(res.players);
          setHostId(res.hostId);
          setPlayerName(savedName);
          setError('');

          if (res.phase === 'loading') {
            setPhase('loading');
            resetPendingMystery();
          } else if (res.phase === 'game') {
            pendingPublicRef.current = res.publicInfo;
            setPhase('loading');
          } else {
            setPhase('lobby');
          }
        });
      } catch {
        clearSession();
      }
    };

    if (socket.connected) attemptRejoin();
    socket.on('connect', attemptRejoin);

    return () => {
      socket.off('playerListUpdate', onPlayerListUpdate);
      socket.off('gamePhase', onGamePhase);
      socket.off('mysteryReady', onMysteryReady);
      socket.off('yourCharacter', onYourCharacter);
      socket.off('gameError', onGameError);
      socket.off('connect', attemptRejoin);
      clearStartTimeout();
    };
  }, []);

  const handleCreate = (e) => {
    e.preventDefault();
    setError('');
    if (!playerName.trim()) return setError('Please enter your name');

    socket.emit('createRoom', playerName, (res) => {
      if (res.ok) {
        setCurrentRoom(res.roomCode);
        setPlayers(res.players);
        setHostId(res.hostId);
        persistSession(res.roomCode, playerName.trim());
        setPhase('lobby');
      } else {
        setError(res.error);
      }
    });
  };

  const handleJoin = (e) => {
    e.preventDefault();
    setError('');
    if (!playerName.trim()) return setError('Please enter your name');
    if (!roomCodeInput.trim()) return setError('Please enter a room code');

    socket.emit('joinRoom', { roomCode: roomCodeInput, playerName }, (res) => {
      if (res.ok) {
        setCurrentRoom(res.roomCode);
        setPlayers(res.players);
        setHostId(res.hostId);
        persistSession(res.roomCode, playerName.trim());
        setPhase('lobby');
      } else {
        setError(res.error);
      }
    });
  };

  const handleStartGame = () => {
    setError('');
    setIsStarting(true);
    resetPendingMystery();

    clearStartTimeout();
    startTimeoutRef.current = setTimeout(() => {
      setError('Something went wrong, try again.');
      setIsStarting(false);
      setPhase('lobby');
      resetPendingMystery();
    }, START_TIMEOUT_MS);

    socket.emit('startGame', { roomCode: currentRoom }, (res) => {
      if (!res?.ok) {
        setError(res?.error || 'Failed to start game');
        setIsStarting(false);
        clearStartTimeout();
      }
    });
  };

  const lobbyPlayers = players.map((p) => ({
    id: p.id,
    name: p.name,
    isHost: p.id === hostId,
  }));

  const adaptCharacter = (char) => {
    if (!char) return null;
    return {
      name: char.character_name,
      background: [char.public_bio, char.private_bio].filter(Boolean).join('\n\n'),
      secret: Array.isArray(char.secrets) ? char.secrets.join('\n\n') : char.secrets,
      motive: char.personal_objective,
    };
  };

  if (phase === 'game' && publicInfo && myCharacter) {
    return (
      <GameScreen
        publicInfo={publicInfo}
        character={adaptCharacter(myCharacter)}
      />
    );
  }

  if (phase === 'loading') {
    return <LoadingMystery />;
  }

  if (phase === 'lobby') {
    return (
      <LobbyScreen
        players={lobbyPlayers}
        currentUserId={socket.id}
        isHost={socket.id === hostId}
        roomCode={currentRoom}
        minPlayers={MIN_PLAYERS}
        onStartGame={handleStartGame}
        isStarting={isStarting}
        error={error}
      />
    );
  }

  return (
    <div className="min-h-screen bg-mystery-bg text-mystery-text flex flex-col items-center justify-center p-6 font-case">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-3">
          <Skull className="w-12 h-12 text-mystery-red mx-auto mb-2" aria-hidden="true" />
          <h1 className="text-4xl sm:text-5xl font-typewriter tracking-widest uppercase text-mystery-text leading-tight">
            Murder<br />Mystery
          </h1>
          <p className="text-mystery-textSecondary italic text-lg">
            A case of deceit and betrayal awaits.
          </p>
        </div>

        <div className="bg-mystery-panel p-8 rounded-sm shadow-2xl border border-mystery-hairline space-y-6 relative overflow-hidden">
          <div
            className="absolute top-0 left-8 w-3 h-3 rounded-full bg-mystery-red border border-mystery-brass shadow-md transform -translate-y-1/2"
            aria-hidden="true"
          />

          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label
                htmlFor="player-name"
                className="block text-left text-xs font-typewriter uppercase tracking-wider text-mystery-textSecondary mb-2"
              >
                Your Identity
              </label>
              <input
                id="player-name"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-black/30 border border-mystery-hairline rounded px-4 py-3 text-mystery-text placeholder-mystery-textSecondary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-mystery-brass focus-visible:border-transparent transition-all font-case"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="p-3 bg-mystery-red/10 border border-mystery-red/30 rounded flex items-start gap-2 text-mystery-red text-sm font-case"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleCreate}
                type="button"
                className="flex items-center justify-center gap-2 py-3 px-4 rounded font-typewriter uppercase tracking-wider text-mystery-text bg-mystery-red hover:bg-red-900 transition-all shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-mystery-brass"
              >
                <UserPlus className="w-4 h-4" aria-hidden="true" />
                <span>Create Game</span>
              </button>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  placeholder="CODE"
                  maxLength={5}
                  aria-label="Room code"
                  className="w-full bg-black/30 border border-mystery-hairline rounded px-3 py-3 text-mystery-brass placeholder-mystery-textSecondary/50 text-center font-typewriter tracking-widest uppercase focus:outline-none focus-visible:ring-2 focus-visible:ring-mystery-brass transition-all"
                />
                <button
                  onClick={handleJoin}
                  type="button"
                  aria-label="Join room"
                  className="py-3 px-5 rounded font-typewriter uppercase tracking-wider bg-mystery-brass text-black hover:bg-yellow-600 transition-all shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-mystery-brass shrink-0"
                >
                  <LogIn className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  if (import.meta.env.DEV && window.location.hash === '#admin') {
    return <AdminTest />;
  }

  if (window.location.hash === '#demo') {
    return <AppDemo />;
  }

  return <AppLive />;
}
