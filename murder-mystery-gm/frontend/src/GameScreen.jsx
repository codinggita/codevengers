import React from 'react';
import PublicInfoBar from './PublicInfoBar';
import CharacterCard from './CharacterCard';

/**
 * Main game view — public case facts plus private dossier in a two-column layout.
 *
 * @param {Object} props
 * @param {Object} props.publicInfo
 * @param {string} props.publicInfo.title
 * @param {string} props.publicInfo.victim
 * @param {string} props.publicInfo.location
 * @param {number} [props.publicInfo.round]
 * @param {number} [props.publicInfo.totalRounds]
 * @param {string} [props.publicInfo.timeLabel]
 * @param {Object} props.character
 * @param {string} props.character.name
 * @param {string} props.character.background
 * @param {string} props.character.secret
 * @param {string} props.character.motive
 */
export default function GameScreen({ publicInfo, character }) {
  return (
    <div className="min-h-screen bg-mystery-bg font-case">
      <PublicInfoBar
        title={publicInfo.title}
        victim={publicInfo.victim}
        location={publicInfo.location}
        round={publicInfo.round}
        totalRounds={publicInfo.totalRounds}
        timeLabel={publicInfo.timeLabel}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left — compact recap / round tracker */}
          <aside className="lg:col-span-4 order-2 lg:order-1">
            <div className="bg-mystery-panel border border-mystery-hairline rounded-sm p-5 sm:p-6 sticky top-4">
              <p className="font-typewriter text-xs uppercase tracking-widest text-mystery-textSecondary mb-3">
                Case Recap
              </p>
              <hr className="border-mystery-hairline mb-4" />

              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="font-typewriter text-xs uppercase text-mystery-textSecondary mb-1">
                    Victim
                  </dt>
                  <dd className="text-mystery-red">{publicInfo.victim}</dd>
                </div>
                <div>
                  <dt className="font-typewriter text-xs uppercase text-mystery-textSecondary mb-1">
                    Location
                  </dt>
                  <dd className="text-mystery-text">{publicInfo.location}</dd>
                </div>
                {publicInfo.round != null && (
                  <div>
                    <dt className="font-typewriter text-xs uppercase text-mystery-textSecondary mb-1">
                      Progress
                    </dt>
                    <dd className="text-mystery-brass">
                      Round {publicInfo.round}
                      {publicInfo.totalRounds != null && ` of ${publicInfo.totalRounds}`}
                    </dd>
                  </div>
                )}
              </dl>

              <p className="mt-6 text-mystery-textSecondary text-sm italic leading-relaxed border-t border-mystery-hairline pt-4">
                Review your dossier. Your secret is yours alone — reveal it only when you choose.
              </p>
            </div>
          </aside>

          {/* Right — hero character card */}
          <main className="lg:col-span-8 order-1 lg:order-2">
            <CharacterCard
              name={character.name}
              background={character.background}
              secret={character.secret}
              motive={character.motive}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
