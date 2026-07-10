import React, { useEffect, useState } from 'react';
import { Stamp } from 'lucide-react';

const DEFAULT_LABEL = 'The Game Master is crafting your mystery…';
const DEFAULT_HINT = 'This may take 10–20 seconds';
const DASH_COUNT = 8;

/**
 * Full-screen loading state while the mystery is generated.
 *
 * @param {Object} props
 * @param {string} [props.label]
 * @param {string} [props.hint]
 */
export default function LoadingMystery({
  label = DEFAULT_LABEL,
  hint = DEFAULT_HINT,
}) {
  const [typedText, setTypedText] = useState('');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);

    const onChange = (e) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setTypedText(label);
      return;
    }

    setTypedText('');
    let index = 0;
    const interval = setInterval(() => {
      index += 1;
      setTypedText(label.slice(0, index));
      if (index >= label.length) clearInterval(interval);
    }, 45);

    return () => clearInterval(interval);
  }, [label, prefersReducedMotion]);

  const showCursor = !prefersReducedMotion && typedText.length < label.length;

  return (
    <div className="min-h-screen bg-mystery-bg flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      <div className="desk-lamp-vignette absolute inset-0 pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 max-w-xl w-full space-y-6">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-case text-mystery-text leading-snug min-h-[3.5rem] sm:min-h-[4.5rem]">
          {prefersReducedMotion ? (
            label
          ) : (
            <>
              {typedText}
              {showCursor && (
                <span className="inline-block w-0.5 h-[1em] bg-mystery-brass ml-0.5 align-middle animate-blink motion-reduce:animate-none" aria-hidden="true" />
              )}
            </>
          )}
        </h2>

        <p className="text-mystery-textSecondary font-case italic text-base sm:text-lg">
          {hint}
        </p>

        <div className="flex flex-col items-center gap-5 pt-4">
          <div
            className="flex items-center justify-center w-14 h-14 rounded-full border-2 border-mystery-brass/40 bg-mystery-panelLight animate-stamp-pulse motion-reduce:animate-none"
            aria-hidden="true"
          >
            <Stamp className="w-7 h-7 text-mystery-brass" />
          </div>

          <div className="flex items-center gap-2" role="progressbar" aria-label="Generating mystery">
            {Array.from({ length: DASH_COUNT }).map((_, i) => (
              <span
                key={i}
                className={`block w-6 h-0.5 rounded-full bg-mystery-brass ${
                  prefersReducedMotion
                    ? 'opacity-60'
                    : 'animate-dash-fill motion-reduce:animate-none'
                }`}
                style={prefersReducedMotion ? undefined : { animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
