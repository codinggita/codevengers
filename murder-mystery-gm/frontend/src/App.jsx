import { useEffect, useState } from 'react';
import { socket } from './socket';

export default function App() {
  const [view, setView] = useState('home'); // home, lobby, generating
  const [playerName, setPlayerName] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [error, setError] = useState('');
  
  const [currentRoom, setCurrentRoom] = useState('');
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  
  useEffect(() => {
    function onPlayerListUpdate({ players, hostId }) {
      setPlayers(players);
      setIsHost(socket.id === hostId);
    }
    
    function onGameStarted({ phase }) {
      setView(phase);
    }
    
    socket.on('playerListUpdate', onPlayerListUpdate);
    socket.on('gameStarted', onGameStarted);
    
    return () => {
      socket.off('playerListUpdate', onPlayerListUpdate);
      socket.off('gameStarted', onGameStarted);
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
        setIsHost(res.isHost);
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
        setIsHost(res.isHost);
        setView('lobby');
      } else {
        setError(res.error);
      }
    });
  };
  
  const handleStartGame = () => {
    setError('');
    socket.emit('startGame', (res) => {
      if (!res?.ok) {
        setError(res?.error || 'Failed to start game');
      }
    });
  };

  if (view === 'generating') {
    return (
      <div className="min-h-screen bg-mystery-bg text-mystery-text flex flex-col items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-md w-full animate-pulse">
          <h2 className="text-3xl font-bold text-mystery-accent">Generating Mystery...</h2>
          <p className="text-mystery-muted">The AI Game Master is weaving a web of deceit. Please wait...</p>
        </div>
      </div>
    );
  }

  if (view === 'lobby') {
    return (
      <div className="min-h-screen bg-mystery-bg text-mystery-text flex flex-col items-center p-6 pt-12">
        <div className="max-w-md w-full bg-mystery-panel rounded-2xl shadow-2xl p-8 space-y-8 border border-mystery-muted/20">
          <div className="text-center">
            <h2 className="text-sm font-semibold tracking-widest text-mystery-muted uppercase mb-2">Room Code</h2>
            <div className="text-5xl font-black text-mystery-accent tracking-widest">{currentRoom}</div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-mystery-text flex items-center justify-between">
              <span>Players</span>
              <span className="text-sm bg-mystery-bg px-3 py-1 rounded-full text-mystery-muted">{players.length} / 10</span>
            </h3>
            <ul className="space-y-2">
              {players.map(p => (
                <li key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-mystery-bg border border-mystery-muted/10">
                  <span className="font-medium">{p.name}</span>
                  {/* Since host is always the first to join or gets reassigned to index 0, this works, but we also can check against hostId directly via isHost if it was this user, though we don't have hostId in state directly. Let's just visually highlight the host. Actually, checking if p.id === players[0]?.id is fine for now, or if we passed hostId explicitly. Let's just do players[0]. */}
                  {p.id === players[0]?.id && <span className="text-xs bg-mystery-accent/20 text-mystery-accent px-2 py-1 rounded-md font-bold uppercase tracking-wider">Host</span>}
                </li>
              ))}
            </ul>
          </div>
          
          {error && <div className="p-3 rounded-lg bg-red-500/20 text-red-400 text-sm border border-red-500/50 text-center">{error}</div>}

          <div className="pt-4">
            {isHost ? (
              <button 
                onClick={handleStartGame}
                disabled={players.length < 3}
                className="w-full py-4 px-6 rounded-xl font-bold text-white bg-mystery-accent hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center shadow-lg shadow-mystery-accent/30"
              >
                {players.length < 3 ? `Need ${3 - players.length} more players` : 'Start Game'}
              </button>
            ) : (
              <div className="text-center p-4 rounded-xl bg-mystery-bg border border-mystery-muted/20">
                <span className="text-mystery-muted flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-mystery-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Waiting for host to start...
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mystery-bg text-mystery-text flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-sm">
            AI Game Master <span className="block text-mystery-accent mt-1">Murder Mystery</span>
          </h1>
          <p className="text-mystery-muted">Enter a world of deceit and betrayal.</p>
        </div>
        
        <div className="bg-mystery-panel p-8 rounded-3xl shadow-2xl border border-mystery-muted/10">
          <form className="space-y-6">
            <div>
              <label className="block text-left text-sm font-medium text-mystery-muted mb-2">Your Name</label>
              <input 
                type="text" 
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                placeholder="Detective Bob"
                className="w-full bg-mystery-bg border border-mystery-muted/30 rounded-xl px-4 py-3 text-white placeholder-mystery-muted/50 focus:outline-none focus:ring-2 focus:ring-mystery-accent focus:border-transparent transition-all"
              />
            </div>
            
            {error && <div className="p-3 rounded-lg bg-red-500/20 text-red-400 text-sm border border-red-500/50 text-left">{error}</div>}

            <div className="grid grid-cols-2 gap-4 pt-2">
              <button 
                onClick={handleCreate}
                type="button"
                className="col-span-2 sm:col-span-1 py-3 px-4 rounded-xl font-bold text-white bg-mystery-accent hover:bg-red-600 transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-mystery-accent/20"
              >
                Create Game
              </button>
              
              <div className="col-span-2 sm:col-span-1 flex gap-2">
                <input 
                  type="text" 
                  value={roomCodeInput}
                  onChange={e => setRoomCodeInput(e.target.value.toUpperCase())}
                  placeholder="CODE"
                  maxLength={5}
                  className="w-full bg-mystery-bg border border-mystery-muted/30 rounded-xl px-4 py-3 text-white placeholder-mystery-muted/50 text-center font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-mystery-muted transition-all uppercase"
                />
                <button 
                  onClick={handleJoin}
                  type="button"
                  className="py-3 px-6 rounded-xl font-bold text-mystery-bg bg-white hover:bg-gray-200 transition-all transform hover:scale-[1.02] active:scale-95"
                >
                  Join
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
