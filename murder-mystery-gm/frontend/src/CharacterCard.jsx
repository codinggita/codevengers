import React from 'react';

export default function CharacterCard({ character }) {
  if (!character) return null;

  return (
    <div className="min-h-screen bg-mystery-bg text-mystery-text p-6 flex justify-center">
      <div className="max-w-2xl w-full space-y-6">
        
        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-bold text-red-400">Keep this secret!</h3>
            <p className="text-sm text-red-300">Do not share this screen with other players. This is your private character sheet.</p>
          </div>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-sm font-semibold tracking-widest text-mystery-muted uppercase">You are playing as</h2>
          <h1 className="text-4xl font-black text-white">{character.character_name}</h1>
        </div>

        <div className="bg-mystery-panel rounded-2xl shadow-xl border border-mystery-muted/20 overflow-hidden">
          
          {/* Public Bio */}
          <div className="p-6 border-b border-mystery-muted/10">
            <h3 className="text-sm font-semibold tracking-wider text-mystery-muted uppercase mb-3">What Others Know About You</h3>
            <p className="text-lg leading-relaxed text-white">{character.public_bio}</p>
          </div>

          {/* Private Bio */}
          <div className="p-6 border-b border-mystery-muted/10 bg-black/20">
            <h3 className="text-sm font-semibold tracking-wider text-mystery-muted uppercase mb-3">What Only You Know</h3>
            <p className="text-lg leading-relaxed text-gray-300 italic">{character.private_bio}</p>
          </div>

          <div className="p-6 border-b border-mystery-muted/10">
            <h3 className="text-sm font-semibold tracking-wider text-mystery-muted uppercase mb-3">Personal Objective</h3>
            <div className="p-4 bg-mystery-accent/10 border border-mystery-accent/30 rounded-lg text-mystery-accent font-medium">
              {character.personal_objective}
            </div>
          </div>

          {/* Alibi */}
          <div className="p-6 border-b border-mystery-muted/10">
            <h3 className="text-sm font-semibold tracking-wider text-mystery-muted uppercase mb-3">Your Story If Asked (Alibi)</h3>
            <p className="text-gray-300">{character.alibi_claimed}</p>
          </div>

          {/* Hidden Info & Secrets */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold tracking-wider text-mystery-muted uppercase mb-3">Hidden Information</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-300">
                {character.hidden_information.map((info, idx) => (
                  <li key={idx}>{info}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold tracking-wider text-mystery-muted uppercase mb-3">Your Secrets</h3>
              <ul className="list-disc list-inside space-y-2 text-red-300">
                {character.secrets.map((secret, idx) => (
                  <li key={idx}>{secret}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Relationships */}
          <div className="p-6 border-t border-mystery-muted/10 bg-black/20">
            <h3 className="text-sm font-semibold tracking-wider text-mystery-muted uppercase mb-4">Relationships</h3>
            <div className="grid gap-3">
              {character.relationships.map((rel, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 p-3 rounded-lg border border-mystery-muted/10 bg-mystery-bg/50">
                  <span className="font-bold text-white min-w-[150px]">{rel.character}</span>
                  <span className="text-gray-400 text-sm">{rel.relation}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
