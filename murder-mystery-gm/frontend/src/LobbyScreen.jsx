import React from 'react';
import { Users, Key, AlertCircle, Copy, Play } from 'lucide-react';

export default function LobbyScreen({ 
  players, 
  currentUserId, 
  isHost, 
  roomCode, 
  minPlayers, 
  onStartGame, 
  isStarting,
  error
}) {
  const playersNeeded = Math.max(0, minPlayers - players.length);
  const canStart = isHost && players.length >= minPlayers;

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
  };

  return (
    <div className="min-h-screen bg-mystery-bg flex items-center justify-center p-4 sm:p-8 font-case">
      <div className="w-full max-w-2xl bg-mystery-panel rounded-sm shadow-2xl relative border border-[#2a251e] overflow-hidden">
        
        {/* Red String Motif (decorative) */}
        <div className="absolute top-0 right-12 w-0.5 h-32 bg-mystery-red/80 -rotate-12 z-0 hidden sm:block"></div>
        <div className="absolute top-16 right-10 w-4 h-4 rounded-full bg-mystery-red border-2 border-mystery-brass shadow-md z-0 hidden sm:block shadow-black/50"></div>

        <div className="relative z-10 p-8 sm:p-12">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-[#3a332a] pb-6 mb-8">
            <div>
              <h1 className="text-4xl font-typewriter text-mystery-text mb-2 tracking-widest uppercase">Case File</h1>
              <p className="text-mystery-textSecondary italic">Status: Assembling Suspects</p>
            </div>
            
            <div className="mt-4 sm:mt-0 flex flex-col items-end">
              <div className="text-xs text-mystery-textSecondary font-typewriter uppercase tracking-wider mb-1">Access Code</div>
              <button 
                onClick={copyRoomCode}
                className="flex items-center space-x-2 bg-black/40 hover:bg-black/60 px-4 py-2 rounded transition-colors group cursor-pointer border border-[#3a332a]"
                title="Copy Room Code"
              >
                <Key className="w-4 h-4 text-mystery-brass" />
                <span className="text-2xl font-typewriter text-mystery-brass tracking-widest">{roomCode}</span>
                <Copy className="w-4 h-4 text-mystery-textSecondary group-hover:text-mystery-text transition-colors opacity-50" />
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-mystery-red/10 border border-mystery-red/30 rounded flex items-start space-x-3 text-mystery-red">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span className="font-typewriter text-sm">{error}</span>
            </div>
          )}

          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl text-mystery-brass font-typewriter tracking-wide uppercase flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Suspects ({players.length})</span>
              </h2>
              {playersNeeded > 0 ? (
                <span className="text-sm text-mystery-red font-typewriter animate-pulse motion-reduce:animate-none">
                  Need {playersNeeded} more...
                </span>
              ) : (
                <span className="text-sm text-green-700/80 font-typewriter">
                  Ready to proceed
                </span>
              )}
            </div>

            <ul className="space-y-3">
              {players.map((p, index) => (
                <li 
                  key={p.id} 
                  className={`flex items-center justify-between p-4 rounded border ${p.id === currentUserId ? 'bg-mystery-panelLight border-mystery-brass/30' : 'bg-black/20 border-transparent'} transition-colors`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-mystery-textSecondary font-typewriter text-sm">{String(index + 1).padStart(2, '0')}</span>
                    <span className={`text-lg ${p.id === currentUserId ? 'text-mystery-brass' : 'text-mystery-text'}`}>
                      {p.name} {p.id === currentUserId && "(You)"}
                    </span>
                  </div>
                  {p.isHost && (
                    <span className="text-xs bg-mystery-brass/20 text-mystery-brass px-2 py-1 rounded font-typewriter uppercase tracking-wider">Host</span>
                  )}
                </li>
              ))}
              
              {/* Empty slots placeholders */}
              {playersNeeded > 0 && Array.from({ length: playersNeeded }).map((_, i) => (
                <li key={`empty-${i}`} className="flex items-center space-x-3 p-4 rounded border border-dashed border-[#3a332a] bg-black/10 opacity-50">
                  <span className="text-mystery-textSecondary font-typewriter text-sm">--</span>
                  <span className="text-mystery-textSecondary italic">Awaiting suspect...</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-6 border-t border-[#3a332a] flex justify-end">
            {isHost ? (
              <button
                onClick={onStartGame}
                disabled={!canStart || isStarting}
                className={`flex items-center space-x-2 px-8 py-3 rounded font-typewriter uppercase tracking-widest shadow-lg transition-all
                  ${!canStart || isStarting 
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50' 
                    : 'bg-mystery-red hover:bg-red-800 text-white hover:-translate-y-0.5 hover:shadow-mystery-red/20 hover:shadow-xl'
                  }`}
              >
                {isStarting ? (
                  <>
                    <span className="animate-pulse motion-reduce:animate-none">Opening Case...</span>
                  </>
                ) : (
                  <>
                    <span>Open Case</span>
                    <Play className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            ) : (
              <div className="px-6 py-3 border border-[#3a332a] bg-black/20 text-mystery-textSecondary font-typewriter italic text-sm flex items-center space-x-2 rounded">
                <span className="w-2 h-2 rounded-full bg-mystery-brass animate-pulse motion-reduce:animate-none"></span>
                <span>Waiting for host to open case...</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
