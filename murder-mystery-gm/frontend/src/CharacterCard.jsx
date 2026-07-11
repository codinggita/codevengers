import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { useTheme } from './themes/ThemeProvider';

/**
 * Private dossier card — the player's role, background, secret, and motive.
 *
 * @param {Object} props
 * @param {string} props.name
 * @param {string} props.background
 * @param {string} props.secret
 * @param {string} props.motive
 * @param {boolean} [props.startRevealed=false]
 */
export default function CharacterCard({
  name,
  background,
  secret,
  motive,
  startRevealed = false,
}) {
  const theme = useTheme();
  const [isRevealed, setIsRevealed] = useState(startRevealed);

  const toggleReveal = () => setIsRevealed((prev) => !prev);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleReveal();
    }
  };

  return (
    <article className={`theme-character-card skin-${theme?.characterCardSkin ?? 'default'} relative w-full font-case`}>
      {/* Red pin + string motif */}
      <div className="absolute -top-3 -left-1 z-20 pointer-events-none" aria-hidden="true">
        <div className="absolute top-4 left-3 w-px h-16 bg-mystery-red/70 rotate-[24deg] origin-top" />
        <MapPin
          className="w-8 h-8 text-mystery-red drop-shadow-md fill-mystery-red/20"
          strokeWidth={1.5}
        />
      </div>

      <div className="theme-invitation-dossier bg-mystery-panelLight border border-mystery-hairline rounded-sm shadow-2xl pt-6 pb-6 sm:pb-8 px-5 sm:px-8 lg:px-10 ml-3">
        <p className="font-typewriter text-xs uppercase tracking-widest text-mystery-textSecondary mb-2">
          Your Role — Private Dossier
        </p>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-case font-semibold text-mystery-text mb-8 leading-tight">
          You are {name}
        </h2>

        <div className="space-y-8">
          {/* Background */}
          <section>
            <h3 className="font-typewriter text-xs uppercase tracking-widest text-mystery-brass mb-2">
              Background
            </h3>
            <p className="text-mystery-text leading-relaxed whitespace-pre-wrap border-l-2 border-mystery-hairline pl-4">
              {background}
            </p>
          </section>

          {/* Secret — redacted until tapped */}
          <section>
            <h3 className="font-typewriter text-xs uppercase tracking-widest text-mystery-brass mb-2">
              Your Secret
            </h3>

            {isRevealed ? (
              <div className="space-y-3">
                <p className="text-mystery-brass leading-relaxed whitespace-pre-wrap border-l-2 border-mystery-brass/40 pl-4">
                  {secret}
                </p>
                <button
                  type="button"
                  onClick={toggleReveal}
                  className="font-typewriter text-xs uppercase tracking-wider text-mystery-textSecondary hover:text-mystery-brass transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-mystery-brass rounded px-1"
                >
                  Tap to hide
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={toggleReveal}
                onKeyDown={handleKeyDown}
                className="w-full text-left rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-mystery-brass focus-visible:ring-offset-2 focus-visible:ring-offset-mystery-panelLight"
                aria-label="Tap to reveal your secret"
              >
                <div className="relative min-h-[4.5rem] rounded border border-mystery-brass/30 overflow-hidden redaction-hatch">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-typewriter text-xs uppercase tracking-widest text-mystery-brass/90 bg-mystery-panel/80 px-3 py-1.5 rounded">
                      Tap to reveal
                    </span>
                  </div>
                </div>
              </button>
            )}
          </section>

          {/* Motive */}
          <section>
            <h3 className="font-typewriter text-xs uppercase tracking-widest text-mystery-brass mb-2">
              Possible Motive
            </h3>
            <p className="text-mystery-text leading-relaxed whitespace-pre-wrap border-l-2 border-mystery-hairline pl-4">
              {motive}
            </p>
          </section>
        </div>
      </div>
    </article>
  );
}
