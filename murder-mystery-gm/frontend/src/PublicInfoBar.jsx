import React from 'react';
import { Skull, MapPin, Clock } from 'lucide-react';

/**
 * Masthead showing shared case facts visible to all players.
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {string} props.victim
 * @param {string} props.location
 * @param {number} [props.round]
 * @param {number} [props.totalRounds]
 * @param {string} [props.timeLabel] - Optional in-fiction time
 */
export default function PublicInfoBar({
  title,
  victim,
  location,
  round,
  totalRounds,
  timeLabel,
}) {
  const roundLabel =
    round != null
      ? totalRounds != null
        ? `${round} / ${totalRounds}`
        : String(round)
      : null;

  return (
    <header className="w-full bg-mystery-panel border-b border-mystery-hairline px-4 sm:px-6 py-5 font-case">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <p className="font-typewriter text-xs uppercase tracking-widest text-mystery-textSecondary">
            Public Record
          </p>
          {roundLabel && (
            <p className="font-typewriter text-xs uppercase tracking-widest text-mystery-brass">
              Round {roundLabel}
            </p>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-case font-semibold text-mystery-text mb-4 leading-tight">
          {title}
        </h1>

        <hr className="border-mystery-hairline mb-4" />

        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="flex items-start gap-2 min-w-0">
            <Skull className="w-5 h-5 text-mystery-red shrink-0 mt-0.5" aria-hidden="true" />
            <div className="min-w-0">
              <dt className="font-typewriter text-xs uppercase tracking-wider text-mystery-textSecondary">
                Victim
              </dt>
              <dd className="text-mystery-text font-medium truncate">{victim}</dd>
            </div>
          </div>

          <div className="flex items-start gap-2 min-w-0">
            <MapPin className="w-5 h-5 text-mystery-textSecondary shrink-0 mt-0.5" aria-hidden="true" />
            <div className="min-w-0">
              <dt className="font-typewriter text-xs uppercase tracking-wider text-mystery-textSecondary">
                Location
              </dt>
              <dd className="text-mystery-text font-medium truncate">{location}</dd>
            </div>
          </div>

          {timeLabel && (
            <div className="flex items-start gap-2 min-w-0">
              <Clock className="w-5 h-5 text-mystery-textSecondary shrink-0 mt-0.5" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="font-typewriter text-xs uppercase tracking-wider text-mystery-textSecondary">
                  Time
                </dt>
                <dd className="text-mystery-brass font-medium truncate">{timeLabel}</dd>
              </div>
            </div>
          )}
        </dl>
      </div>
    </header>
  );
}
