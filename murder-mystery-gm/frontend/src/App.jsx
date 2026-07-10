import { useEffect, useState } from 'react';
import { socket } from './socket';
import { Skull, UserPlus, LogIn, AlertCircle } from 'lucide-react';
import LobbyScreen from './LobbyScreen';
import LoadingMystery from './LoadingMystery';
import PublicInfoBar from './PublicInfoBar';
import CharacterCard from './CharacterCard';
import AdminTest from './AdminTest';

const MIN_PLAYERS = 3;

export default function App() {
  const [view, setView] = useState('home'); // home, lobby, generating, investigation
  const [playerName, setPlayerName] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [error, setError] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  const [currentRoom, setCurrentRoom] = useState('');
  const [players, setPlayers] = useState([]);
  const [hostId, setHostId] = useState('');
  const [myCharacter, setMyCharacter] = useState(null);
  const [caseInfo, setCaseInfo] = useState(null);

  useEffect(() => {
    function onPlayerListUpdate({ players: updatedPlayers, hostId: updatedHostId }) {
      setPlayers(updatedPlayers);
      setHostId(updatedHostId);
    }

    function onGameStarted({ phase, caseInfo: info }) {
      setView(phase);
      setIsStarting(false);
      if (phase === 'generating') setError('');
      if (info) setCaseInfo(info);
    }

    function onCharacterAssigned(character) {
      setMyCharacter(character);
    }

    function onGameError({ message }) {
      setError(message);
      setIsStarting(false);
      setView('lobby');
    }

    socket.on('playerListUpdate', onPlayerListUpdate);
    socket.on('gameStarted', onGameStarted);
    socket.on('characterAssigned', onCharacterAssigned);
    socket.on('gameError', onGameError);

    return () => {
      socket.off('playerListUpdate', onPlayerListUpdate);
      socket.off('gameStarted', onGameStarted);
      socket.off('characterAssigned', onCharacterAssigned);
      socket.off('gameError', onGameError);
    };
  }, []);

  // --- DEV Admin Panel ---
  if (import.meta.env.DEV && window.location.hash === '#admin') {
    return <AdminTest />;
  }

  // --- Handlers ---
  const handleCreate = (e) => {
    e.preventDefault();
    setError('');
    if (!playerName.trim()) return setError('Please enter your name');

    socket.emit('createRoom', playerName, (res) => {
      if (res.ok) {
        setCurrentRoom(res.roomCode);
        setPlayers(res.players);
        setHostId(res.hostId);
        setView('lobby');
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
        setView('lobby');
      } else {
        setError(res.error);
      }
    });
  };

  const handleStartGame = () => {
    setError('');
    setIsStarting(true);
    socket.emit('startGame', (res) => {
      if (!res?.ok) {
        setError(res?.error || 'Failed to start game');
        setIsStarting(false);
      }
    });
  };

  // =====================
  //  ADAPTER LAYER
  // =====================

  // Map socket players array to LobbyScreen's expected shape
  const lobbyPlayers = players.map(p => ({
    id: p.id,
    name: p.name,
    isHost: p.id === hostId
  }));

  // Map socket character payload to CharacterCard props
  const adaptCharacter = (char) => {
    if (!char) return {};
    return {
      name: char.character_name,
      background: char.public_bio + '\n\n' + char.private_bio,
      secret: char.secrets?.join('\n'),
      hiddenInfo: char.hidden_information?.join('\n'),
      motive: char.personal_objective,
      relationships: char.relationships || [],
      alibi: char.alibi_claimed
    };
  };

  // =====================
  //  VIEWS
  // =====================

  if (view === 'investigation') {
    const adapted = adaptCharacter(myCharacter);
    return (
      <div className="min-h-screen bg-mystery-bg">
        <PublicInfoBar
          title={caseInfo?.title}
          victim={caseInfo?.victim}
          location={caseInfo?.location}
        />
        <CharacterCard
          name={adapted.name}
          background={adapted.background}
          secret={adapted.secret}
          hiddenInfo={adapted.hiddenInfo}
          motive={adapted.motive}
          relationships={adapted.relationships}
          alibi={adapted.alibi}
        />
      </div>
    );
  }

  if (view === 'generating') {
    return <LoadingMystery />;
  }

  if (view === 'lobby') {
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

  // =====================
  //  HOME SCREEN
  // =====================
  return (
    <div className="min-h-screen bg-mystery-bg text-mystery-text flex flex-col items-center justify-center p-6 font-case">
      <div className="max-w-md w-full text-center space-y-8">

        {/* Title */}
        <div className="space-y-3">
          <Skull className="w-12 h-12 text-mystery-red mx-auto mb-2" />
          <h1 className="text-5xl font-typewriter tracking-widest uppercase text-mystery-text leading-tight">
            Murder<br/>Mystery
          </h1>
          <p className="text-mystery-textSecondary italic text-lg">A case of deceit and betrayal awaits.</p>
        </div>

        {/* Form Panel */}
        <div className="bg-mystery-panel p-8 rounded-sm shadow-2xl border border-[#2a251e] space-y-6 relative overflow-hidden">
          {/* Decorative pin */}
          <div className="absolute top-0 left-8 w-3 h-3 rounded-full bg-mystery-red border border-mystery-brass shadow-md transform -translate-y-1/2"></div>

          <form className="space-y-5">
            <div>
              <label className="block text-left text-xs font-typewriter uppercase tracking-wider text-mystery-textSecondary mb-2">
                Your Identity
              </label>
              <input
                type="text"
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-black/30 border border-[#3a332a] rounded px-4 py-3 text-mystery-text placeholder-mystery-textSecondary/50 focus:outline-none focus:ring-2 focus:ring-mystery-brass focus:border-transparent transition-all font-case"
              />
            </div>

            {error && (
              <div className="p-3 bg-mystery-red/10 border border-mystery-red/30 rounded flex items-start space-x-2 text-mystery-red text-sm font-typewriter">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleCreate}
                type="button"
                className="flex items-center justify-center space-x-2 py-3 px-4 rounded font-typewriter uppercase tracking-wider text-white bg-mystery-red hover:bg-red-800 transition-all shadow-lg hover:shadow-mystery-red/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Game</span>
              </button>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={roomCodeInput}
                  onChange={e => setRoomCodeInput(e.target.value.toUpperCase())}
                  placeholder="CODE"
                  maxLength={5}
                  className="w-full bg-black/30 border border-[#3a332a] rounded px-3 py-3 text-mystery-brass placeholder-mystery-textSecondary/50 text-center font-typewriter tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-mystery-brass transition-all"
                />
                <button
                  onClick={handleJoin}
                  type="button"
                  className="py-3 px-5 rounded font-typewriter uppercase tracking-wider bg-mystery-brass text-black hover:bg-yellow-600 transition-all shadow-lg hover:-translate-y-0.5 active:translate-y-0 shrink-0"
                >
                  <LogIn className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
