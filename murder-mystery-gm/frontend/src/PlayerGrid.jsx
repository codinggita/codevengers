import React from 'react';

export default function PlayerGrid({ players, typingPlayers, gmSpeaking }) {
  return (
    <div className="max-w-6xl mx-auto w-full px-4 py-3 border-b border-[#2a251e] bg-[#0b0a08]">
      <div className="flex flex-wrap gap-4 justify-center md:justify-start">
        {/* Game Master Tile */}
        <div className={`relative flex items-center p-2 rounded bg-[#161310] border-2 transition-colors ${
          gmSpeaking ? 'border-mystery-red shadow-[0_0_10px_rgba(179,35,28,0.5)]' : 'border-[#3a332a]'
        }`}>
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-black/50 border border-[#2a251e] text-mystery-red font-typewriter">GM</div>
          <span className="ml-3 font-typewriter text-sm tracking-widest uppercase text-mystery-textSecondary">Game Master</span>
        </div>

        {/* Player Tiles */}
        {players.map(p => {
          const isActive = typingPlayers[p.id] !== undefined;
          return (
            <div key={p.id} className={`relative flex items-center p-2 rounded bg-[#161310] border-2 transition-colors ${
              isActive ? 'border-mystery-brass shadow-[0_0_10px_rgba(212,162,76,0.3)]' : 'border-[#3a332a]'
            }`}>
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-black/50 border border-[#2a251e] text-mystery-text font-case">
                {p.character?.character_name?.charAt(0) || p.name.charAt(0)}
              </div>
              <span className="ml-3 font-typewriter text-xs tracking-widest uppercase text-mystery-text">
                {p.character?.character_name || p.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
