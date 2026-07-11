import React from 'react';
import { useTheme } from './themes/ThemeProvider';

export default function PlayerGrid({ players, typingPlayers, gmSpeaking }) {
  const theme = useTheme();
  const PlayerIcon = theme?.icons.player;
  const GmIcon = theme?.icons.gm;

  return (
    <div className={`theme-player-grid skin-${theme?.playerTileSkin ?? 'default'} max-w-6xl mx-auto w-full px-4 py-3`}>
      <div className="flex flex-wrap gap-4 justify-center md:justify-start">
        {/* Game Master Tile */}
        <div className={`theme-place-card theme-gm-card relative flex items-center p-2 transition-colors ${
          gmSpeaking ? 'is-speaking' : ''
        }`}>
          <div className="theme-place-card-icon">
            {GmIcon ? <GmIcon aria-hidden="true" /> : 'GM'}
          </div>
          <span className="ml-3 font-case text-sm text-mystery-text">
            {theme?.gmTitle || 'Game Master'}
          </span>
        </div>

        {/* Player Tiles */}
        {players.map(p => {
          const isActive = typingPlayers[p.id] !== undefined;
          return (
            <div key={p.id} className={`theme-place-card relative flex items-center p-2 transition-colors ${
              isActive ? 'is-active' : ''
            }`}>
              <div className="theme-place-card-icon">
                {PlayerIcon ? <PlayerIcon aria-hidden="true" /> : p.character?.character_name?.charAt(0) || p.name.charAt(0)}
              </div>
              <span className="ml-3 font-case text-sm text-mystery-text">
                {p.character?.character_name || p.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
