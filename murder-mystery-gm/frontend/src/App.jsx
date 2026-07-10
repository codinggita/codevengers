import { useEffect, useState } from 'react';
import { socket } from './socket';
import { Skull, UserPlus, LogIn, AlertCircle, Users, FileSearch, Fingerprint } from 'lucide-react';
import LobbyScreen from './LobbyScreen';
import LoadingMystery from './LoadingMystery';
import PublicInfoBar from './PublicInfoBar';
import CharacterCard from './CharacterCard';
import InvestigateTab from './InvestigateTab';
import AccuseTab from './AccuseTab';
import RevealScreen from './RevealScreen';
import PlayerGrid from './PlayerGrid';
import AdminTest from './AdminTest';

const MIN_PLAYERS = 3;

export default function App() {
  const [view, setView] = useState('home'); // home, lobby, loading, game, reveal
  const [playerName, setPlayerName] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [error, setError] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  const [currentRoom, setCurrentRoom] = useState('');
  const [players, setPlayers] = useState([]);
  const [hostId, setHostId] = useState('');
  const [myCharacter, setMyCharacter] = useState(null);
  const [caseInfo, setCaseInfo] = useState(null);
  
  const [typingPlayers, setTypingPlayers] = useState({});
  const [gmSpeaking, setGmSpeaking] = useState(false);

  // Phase 3 State
  const [gameTab, setGameTab] = useState('dossier'); // dossier, investigate, accuse
  const [sharedClues, setSharedClues] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteCount, setVoteCount] = useState(0);
  const [revealData, setRevealData] = useState(null);

  useEffect(() => {
    function onPlayerListUpdate({ players: updatedPlayers, hostId: updatedHostId }) {
      setPlayers(updatedPlayers);
      setHostId(updatedHostId);
    }

    function onGamePhase({ phase }) {
      if (phase === 'loading') {
        setView('loading');
        setIsStarting(false);
        setError('');
      } else if (phase === 'lobby') {
        setView('lobby');
        setIsStarting(false);
        setError('');
        setRevealData(null);
        setMyCharacter(null);
        setCaseInfo(null);
        setHasVoted(false);
        setVoteCount(0);
        setSharedClues([]);
      }
    }

    function onMysteryReady({ publicInfo }) {
      setCaseInfo(publicInfo);
      setView('game');
      setGameTab('dossier');
      setSharedClues([]);
      setHasVoted(false);
      setVoteCount(0);
    }

    function onYourCharacter(character) {
      setMyCharacter(character);
    }
    
    function onClueDiscovered(clue) {
      setSharedClues(prev => {
        if (prev.some(c => c.id === clue.id)) return prev;
        return [...prev, clue];
      });
    }
    
    function onVoteCast({ voterName }) {
      setVoteCount(prev => prev + 1);
    }
    
    function onFinalReveal(data) {
      setRevealData(data);
      setView('reveal');
    }

    function onGameError({ message }) {
      setError(message);
      setIsStarting(false);
      if (view === 'loading') setView('lobby');
    }

    function onPlayerTypingUpdate({ playerId, playerName, isTyping }) {
      setTypingPlayers(prev => {
        const next = { ...prev };
        if (isTyping) {
          next[playerId] = playerName;
        } else {
          delete next[playerId];
        }
        return next;
      });
    }

    if (view === 'game' || view === 'lobby') {
      socket.on('playerListUpdate', onPlayerListUpdate);
      socket.on('playerTypingUpdate', onPlayerTypingUpdate);
    }

    socket.on('gamePhase', onGamePhase);
    socket.on('mysteryReady', onMysteryReady);
    socket.on('yourCharacter', onYourCharacter);
    socket.on('clueDiscovered', onClueDiscovered);
    socket.on('voteCast', onVoteCast);
    socket.on('finalReveal', onFinalReveal);
    socket.on('gameError', onGameError);

    return () => {
      socket.off('playerListUpdate', onPlayerListUpdate);
      socket.off('playerTypingUpdate', onPlayerTypingUpdate);
      socket.off('gamePhase', onGamePhase);
      socket.off('mysteryReady', onMysteryReady);
      socket.off('yourCharacter', onYourCharacter);
      socket.off('clueDiscovered', onClueDiscovered);
      socket.off('voteCast', onVoteCast);
      socket.off('finalReveal', onFinalReveal);
      socket.off('gameError', onGameError);
    };
  }, [view]);

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
    socket.emit('startGame', { roomCode: currentRoom }, (res) => {
      if (!res?.ok) {
        setError(res?.error || 'Failed to start game');
        setIsStarting(false);
      }
    });
  };

  const handleVote = (accusedId, motive) => {
    socket.emit('submitVote', { accusedId, motive });
    setHasVoted(true);
  };

  const handleReturnToLobby = () => {
    socket.emit('returnToLobby');
  };

  // =====================
  //  ADAPTER LAYER
  // =====================

  const lobbyPlayers = players.map(p => ({
    id: p.id,
    name: p.name,
    isHost: p.id === hostId
  }));

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

  if (view === 'reveal' && revealData) {
    return (
      <RevealScreen 
        revealData={revealData}
        isHost={socket.id === hostId}
        onReturnToLobby={handleReturnToLobby}
        setGmSpeaking={setGmSpeaking}
      />
    );
  }

  if (view === 'game') {
    const adapted = adaptCharacter(myCharacter);
    
    return (
      <div className="min-h-screen bg-mystery-bg flex flex-col pb-20">
        <PublicInfoBar
          title={caseInfo?.title}
          victim={caseInfo?.victim}
          location={caseInfo?.location}
          round={caseInfo?.round}
          totalRounds={caseInfo?.totalRounds}
        />

        <PlayerGrid players={players} typingPlayers={typingPlayers} gmSpeaking={gmSpeaking} />
        
        <div className="flex-1">
          {gameTab === 'dossier' && (
            <CharacterCard
              name={adapted.name}
              background={adapted.background}
              secret={adapted.secret}
              hiddenInfo={adapted.hiddenInfo}
              motive={adapted.motive}
              relationships={adapted.relationships}
              alibi={adapted.alibi}
            />
          )}
          {gameTab === 'investigate' && (
            <InvestigateTab 
              sharedClues={sharedClues} 
              setGmSpeaking={setGmSpeaking} 
              typingPlayers={typingPlayers}
            />
          )}
          {gameTab === 'accuse' && (
            <AccuseTab 
              players={players} 
              currentUserId={socket.id}
              hasVoted={hasVoted}
              voteCount={voteCount}
              totalPlayers={players.length}
              onVote={handleVote}
            />
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 w-full bg-[#110e0c] border-t border-[#2a251e] flex justify-around p-3 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
          <button 
            onClick={() => setGameTab('dossier')}
            className={`font-typewriter tracking-widest text-sm uppercase px-4 py-2 rounded transition-colors ${gameTab === 'dossier' ? 'text-mystery-brass bg-[#2a251e]' : 'text-mystery-textSecondary hover:text-mystery-text'}`}
          >
            Dossier
          </button>
          <button 
            onClick={() => setGameTab('investigate')}
            className={`font-typewriter tracking-widest text-sm uppercase px-4 py-2 rounded transition-colors ${gameTab === 'investigate' ? 'text-mystery-brass bg-[#2a251e]' : 'text-mystery-textSecondary hover:text-mystery-text'}`}
          >
            Investigate
          </button>
          <button 
            onClick={() => setGameTab('accuse')}
            className={`font-typewriter tracking-widest text-sm uppercase px-4 py-2 rounded transition-colors ${gameTab === 'accuse' ? 'text-mystery-red bg-[#3a1010]' : 'text-mystery-red/60 hover:text-mystery-red'}`}
          >
            Accuse
          </button>
        </div>
    </div>
    );
  }

  if (view === 'loading') {
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
    <div className="home-case-page min-h-screen text-mystery-text font-case">
      <div className="home-case-grain" aria-hidden="true" />
      <main className="home-case-shell">
        <div className="home-case-folder" aria-hidden="true">
          <div className="home-case-tab">CONFIDENTIAL</div>
          <div className="home-case-cover">
            <Skull className="home-case-cover-mark" />
            <p>Case file no. MM-01</p>
            <strong>Murder Mystery</strong>
          </div>
        </div>

        <section className="home-case-content" aria-label="Murder Mystery game entry">
          <header className="home-case-header">
            <p className="home-case-eyebrow">Case file no. MM-01 · Active investigation</p>
            <h1>Murder<br /><span>Mystery</span></h1>
            <p className="home-case-tagline">Every table holds a secret. Every secret leaves a trace.</p>
          </header>

          <div className="home-case-dossier">
            <div className="home-case-fastener" aria-hidden="true" />
            <p className="home-case-section-label">Player credentials</p>

            <form className="home-case-form">
              <label className="home-case-label" htmlFor="player-name">Your identity</label>
              <input
                id="player-name"
                type="text"
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="home-case-input"
              />

              {error && (
                <div className="home-case-error" role="alert">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="home-case-actions">
                <button
                  onClick={handleCreate}
                  type="button"
                  className="home-case-create"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create game</span>
                </button>

                <details className="home-case-join">
                  <summary>
                    <LogIn className="w-4 h-4" />
                    <span>Join game</span>
                  </summary>
                  <div className="home-case-join-panel">
                    <label className="home-case-label" htmlFor="room-code">Room code</label>
                    <div className="home-case-code-row">
                      <input
                        id="room-code"
                        type="text"
                        value={roomCodeInput}
                        onChange={e => setRoomCodeInput(e.target.value.toUpperCase())}
                        placeholder="CODE"
                        maxLength={5}
                        className="home-case-input home-case-code-input"
                      />
                      <button
                        onClick={handleJoin}
                        type="button"
                        className="home-case-enter"
                        aria-label="Join game"
                      >
                        Enter
                      </button>
                    </div>
                  </div>
                </details>
              </div>
            </form>
          </div>

          <p className="home-case-footer">Issued for tonight’s investigation · Trust no alibi</p>
        </section>
      </main>
    </div>
  );
}
