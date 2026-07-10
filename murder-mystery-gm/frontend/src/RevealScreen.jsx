import React, { useState, useEffect } from 'react';
import { Skull, AlertTriangle, CheckCircle, RefreshCcw } from 'lucide-react';
import { speakGameMaster } from './utils/speech';

export default function RevealScreen({ revealData, isHost, onReturnToLobby, setGmSpeaking }) {
  const { trueMurdererName, voteBreakdown, epilogueText, success } = revealData;
  const [typedEpilogue, setTypedEpilogue] = useState('');
  const [revealStage, setRevealStage] = useState('verdict'); // 'verdict' | 'truth' | 'epilogue'
  
  // Sequence the reveals
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setRevealStage('epilogue');
      return;
    }
    
    const truthTimer = setTimeout(() => setRevealStage('truth'), 1500);
    const epilogueTimer = setTimeout(() => {
      setRevealStage('epilogue');
      speakGameMaster(
        revealData.epilogueText,
        () => setGmSpeaking?.(true),
        () => setGmSpeaking?.(false)
      );
    }, 2500);
    
    return () => { clearTimeout(truthTimer); clearTimeout(epilogueTimer); };
  }, []);
  
  // Typewriter effect for epilogue
  useEffect(() => {
    if (revealStage !== 'epilogue') return;
    
    setTypedEpilogue('');
    let index = 0;

    if ('speechSynthesis' in window) {
      setTypedEpilogue(epilogueText);
      return;
    }

    const interval = setInterval(() => {
      index += 1;
      setTypedEpilogue(epilogueText.substring(0, index));
      if (index >= epilogueText.length) {
        clearInterval(interval);
      }
    }, 20); // 20ms per character

    return () => clearInterval(interval);
  }, [epilogueText, revealStage]);

  return (
    <div className="min-h-screen bg-mystery-bg text-mystery-text font-case p-6 pb-24 overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto space-y-12 mt-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-typewriter tracking-widest text-mystery-red uppercase">
            The Verdict
          </h1>
          <p className="text-xl text-mystery-textSecondary italic">
            The truth always comes to light.
          </p>
        </div>

        {/* Section 1: The Votes */}
        <div className="bg-[#161310] border border-[#2a251e] rounded shadow-2xl p-8 relative">
          <div className="absolute top-0 right-8 w-3 h-3 rounded-full bg-mystery-red border border-mystery-brass shadow-md transform -translate-y-1/2"></div>
          
          <h2 className="text-2xl font-typewriter text-mystery-brass uppercase tracking-widest mb-6">
            Player Accusations
          </h2>
          
          <div className="space-y-6">
            {voteBreakdown.map((vote, i) => (
              <div key={i} className="border-b border-[#2a251e] pb-4 last:border-0 last:pb-0">
                <p className="text-lg text-mystery-text">
                  <span className="font-typewriter uppercase text-mystery-brass">{vote.voterName}</span> accused{' '}
                  <span className="text-mystery-red font-bold">{vote.accusedName}</span>
                </p>
                <p className="text-sm text-mystery-textSecondary mt-2 italic border-l-2 border-[#3a332a] pl-3">
                  "{vote.motive}"
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: The Truth */}
        <div className={`border-2 rounded shadow-2xl p-8 text-center transition-all duration-1000 transform ${
          revealStage === 'verdict' ? 'opacity-0 translate-y-8 pointer-events-none' : 'opacity-100 translate-y-0'
        } ${
          success ? 'bg-green-900/20 border-green-700/50' : 'bg-red-950/30 border-mystery-red/50'
        }`}>
          {success ? (
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          ) : (
            <AlertTriangle className="w-16 h-16 text-mystery-red mx-auto mb-4" />
          )}
          
          <h2 className="text-4xl font-typewriter uppercase tracking-widest mb-2 text-white">
            The true murderer was <span className="text-mystery-red">{trueMurdererName}</span>
          </h2>
          
          <p className="text-xl mt-4 font-typewriter tracking-widest">
            {success ? (
              <span className="text-green-400">Justice Served</span>
            ) : (
              <span className="text-mystery-red">The Murderer Escaped</span>
            )}
          </p>
        </div>

        {/* Section 3: The Epilogue */}
        <div className={`bg-black/40 border border-[#2a251e] rounded shadow-2xl p-8 min-h-[200px] transition-all duration-1000 transform ${
          revealStage !== 'epilogue' ? 'opacity-0 translate-y-8 pointer-events-none' : 'opacity-100 translate-y-0'
        }`}>
          <h2 className="text-sm font-typewriter text-mystery-textSecondary uppercase tracking-widest mb-4">
            Game Master's Epilogue
          </h2>
          <div className="font-typewriter text-lg leading-relaxed text-mystery-text whitespace-pre-wrap">
            {typedEpilogue}
            {typedEpilogue.length < epilogueText.length && (
              <span className="inline-block w-2 h-5 bg-mystery-brass ml-1 animate-pulse align-middle"></span>
            )}
          </div>
        </div>

        {/* Play Again Action */}
        <div className={`flex justify-center pt-8 transition-opacity duration-1000 ${
          revealStage !== 'epilogue' ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}>
          {isHost ? (
            <button
              onClick={onReturnToLobby}
              className="flex items-center space-x-2 py-4 px-8 rounded font-typewriter uppercase tracking-widest text-black bg-mystery-brass hover:bg-yellow-600 transition-all shadow-lg hover:-translate-y-0.5"
            >
              <RefreshCcw className="w-5 h-5" />
              <span>Play Again</span>
            </button>
          ) : (
            <div className="text-mystery-textSecondary font-typewriter uppercase tracking-widest animate-pulse">
              Waiting for host to start a new game...
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
