import React, { useState } from 'react';
import { Eye, EyeOff, User, BookOpen, AlertTriangle, Fingerprint, Clock, Users } from 'lucide-react';

export default function CharacterCard({ 
  name, 
  background, 
  secret, 
  hiddenInfo,
  motive, 
  relationships,
  alibi,
  startRevealed = false 
}) {
  const [isRevealed, setIsRevealed] = useState(startRevealed);

  const toggleReveal = () => setIsRevealed(!isRevealed);

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 font-case p-4 sm:p-0">
      <div className="bg-[#eeebd9] text-black shadow-2xl relative overflow-hidden rounded-sm before:content-[''] before:absolute before:inset-0 before:bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] before:opacity-50 before:pointer-events-none border border-[#d4cfbd]">
        
        {/* Top Paper Edge / Tape Motif */}
        <div className="h-4 w-full bg-[#e3deca] border-b border-[#d4cfbd] shadow-sm mb-6 flex justify-between px-10">
          <div className="w-8 h-full bg-black/5 mx-4"></div>
          <div className="w-8 h-full bg-black/5 mx-4"></div>
        </div>

        <div className="p-6 sm:p-10 lg:p-14 pt-0">
          
          <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-black/80 pb-6 mb-8 relative">
            <div>
              <p className="text-xs font-typewriter uppercase tracking-widest text-black/60 mb-2">Subject Identifier</p>
              <h2 className="text-4xl sm:text-5xl font-typewriter font-bold tracking-tight text-black">{name}</h2>
            </div>
            <div className="mt-4 sm:mt-0 px-4 py-2 border-2 border-mystery-red text-mystery-red font-typewriter font-bold uppercase transform rotate-2 opacity-80 text-xl tracking-widest">
              CONFIDENTIAL
            </div>
          </div>

          <div className="space-y-10">
            {/* Background Section */}
            <section className="relative">
              <h3 className="flex items-center space-x-2 text-sm font-typewriter uppercase tracking-widest text-black/70 mb-3 border-b border-black/20 pb-2">
                <BookOpen className="w-4 h-4" />
                <span>Background Dossier</span>
              </h3>
              <p className="text-lg leading-relaxed whitespace-pre-wrap pl-6 border-l-4 border-mystery-brass/40">
                {background}
              </p>
            </section>

            {/* Relationships & Alibi Section (Visible) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section className="relative">
                <h3 className="flex items-center space-x-2 text-sm font-typewriter uppercase tracking-widest text-black/70 mb-3 border-b border-black/20 pb-2">
                  <Users className="w-4 h-4" />
                  <span>Known Associates</span>
                </h3>
                <ul className="space-y-3 pl-6 border-l-4 border-mystery-brass/40">
                  {relationships && relationships.length > 0 ? relationships.map((rel, idx) => (
                    <li key={idx} className="text-base leading-snug">
                      <strong className="font-typewriter text-black/80">{rel.character}</strong>: {rel.relation}
                    </li>
                  )) : (
                    <li className="text-black/50 italic">None recorded.</li>
                  )}
                </ul>
              </section>

              <section className="relative">
                <h3 className="flex items-center space-x-2 text-sm font-typewriter uppercase tracking-widest text-black/70 mb-3 border-b border-black/20 pb-2">
                  <Clock className="w-4 h-4" />
                  <span>Claimed Alibi</span>
                </h3>
                <p className="text-lg leading-relaxed pl-6 border-l-4 border-mystery-brass/40">
                  {alibi || <span className="text-black/50 italic">None recorded.</span>}
                </p>
              </section>
            </div>

            {/* Hidden Secrets Section */}
            <section className="relative bg-black/[0.03] p-6 rounded border border-black/10 mt-12 shadow-inner">
              <div className="absolute -top-4 left-6 bg-[#eeebd9] px-4 flex items-center space-x-3 cursor-pointer group" onClick={toggleReveal} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && toggleReveal()}>
                <h3 className="flex items-center space-x-2 text-sm font-typewriter uppercase tracking-widest text-mystery-red font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Classified Intel</span>
                </h3>
                <div className="p-1.5 rounded-full bg-mystery-red/10 text-mystery-red group-hover:bg-mystery-red group-hover:text-white transition-colors">
                  {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </div>
              </div>

              <div className={`mt-4 transition-all duration-300 ${isRevealed ? 'opacity-100 blur-none' : 'opacity-80'}`}>
                {isRevealed ? (
                  <div className="space-y-6">
                    <div>
                      <p className="text-xs font-typewriter uppercase text-mystery-red/80 mb-1 flex items-center space-x-1"><Fingerprint className="w-3 h-3"/> <span>Motive</span></p>
                      <p className="text-lg font-semibold leading-relaxed whitespace-pre-wrap">{motive}</p>
                    </div>
                    <div>
                      <p className="text-xs font-typewriter uppercase text-mystery-red/80 mb-1 flex items-center space-x-1"><Fingerprint className="w-3 h-3"/> <span>Secret Acts</span></p>
                      <p className="text-lg font-semibold leading-relaxed whitespace-pre-wrap">{secret}</p>
                    </div>
                    {hiddenInfo && (
                      <div>
                        <p className="text-xs font-typewriter uppercase text-mystery-red/80 mb-1 flex items-center space-x-1"><Eye className="w-3 h-3"/> <span>Hidden Knowledge</span></p>
                        <p className="text-lg font-semibold leading-relaxed whitespace-pre-wrap">{hiddenInfo}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-10 pointer-events-none"></div>
                    <div className="space-y-3 font-typewriter text-xl font-bold tracking-widest text-black/80 select-none">
                      <span className="bg-black text-white px-2 py-0.5 inline-block -rotate-1">REDACTED</span>{' '}
                      <span className="bg-black text-white px-2 py-0.5 inline-block rotate-1">REDACTED</span>{' '}
                      <span className="bg-black text-white px-2 py-0.5 inline-block -rotate-2">REDACTED</span><br/>
                      <span className="bg-black text-white px-2 py-0.5 inline-block rotate-2">REDACTED</span>{' '}
                      <span className="bg-black text-white px-2 py-0.5 inline-block">REDACTED</span>
                    </div>
                    <p className="text-sm font-typewriter text-mystery-red mt-4 italic text-center opacity-70 animate-pulse motion-reduce:animate-none">Click to reveal confidential information</p>
                  </div>
                )}
              </div>
            </section>
            
          </div>
        </div>
      </div>
    </div>
  );
}
