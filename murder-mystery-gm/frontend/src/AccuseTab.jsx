import { useState } from 'react';
import { Gavel, AlertCircle, Clock } from 'lucide-react';

export default function AccuseTab({ players, currentUserId, hasVoted, voteCount, totalPlayers, onVote }) {
  const [selectedSuspect, setSelectedSuspect] = useState('');
  const [motive, setMotive] = useState('');
  const [error, setError] = useState('');

  // Exclude current player from suspects list
  const suspects = players.filter(p => p.id !== currentUserId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (hasVoted) return;
    
    if (!selectedSuspect) {
      setError("You must select a suspect.");
      return;
    }
    if (!motive.trim() || motive.length < 10) {
      setError("Please provide a brief explanation (at least 10 characters).");
      return;
    }

    onVote(selectedSuspect, motive);
  };

  if (hasVoted) {
    return (
      <div className="flex flex-col items-center justify-center p-8 mt-12 font-case max-w-lg mx-auto text-center space-y-6">
        <Clock className="w-16 h-16 text-mystery-brass animate-pulse opacity-80" />
        <h2 className="text-3xl font-typewriter text-mystery-red uppercase tracking-widest">
          Accusation Cast
        </h2>
        <p className="text-mystery-textSecondary text-lg">
          Your choice has been recorded. We now wait for the others.
        </p>
        
        <div className="mt-8 p-6 bg-[#161310] border border-[#2a251e] rounded-sm w-full">
          <p className="font-typewriter text-xl text-mystery-brass tracking-wider">
            {voteCount} OF {totalPlayers} SUSPECTS
          </p>
          <p className="text-sm text-mystery-textSecondary uppercase tracking-widest mt-2">
            Have Cast Their Accusations
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-6 max-w-2xl mx-auto font-case mt-4">
      <div className="text-center mb-8">
        <Gavel className="w-12 h-12 text-mystery-red mx-auto mb-4" />
        <h2 className="text-3xl font-typewriter text-mystery-red uppercase tracking-widest">
          Make Your Accusation
        </h2>
        <p className="text-mystery-textSecondary mt-2">
          Review the evidence. When you are certain, point the finger.
          <br/> <span className="text-mystery-brass">This action cannot be undone.</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-8 bg-[#161310] p-8 border border-[#2a251e] rounded shadow-2xl relative">
        {/* Red pin detail */}
        <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-mystery-red border-2 border-mystery-brass shadow-md"></div>
        
        {error && (
          <div className="p-3 bg-mystery-red/10 border border-mystery-red/30 rounded flex items-start space-x-2 text-mystery-red text-sm font-typewriter">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3">
          <label className="block font-typewriter text-mystery-brass uppercase tracking-widest text-sm">
            1. Who is the murderer?
          </label>
          <div className="space-y-2">
            {suspects.map(suspect => (
              <label 
                key={suspect.id}
                onClick={() => setSelectedSuspect(suspect.id)}
                className={`block p-4 border rounded cursor-pointer transition-all ${
                  selectedSuspect === suspect.id 
                    ? 'bg-mystery-red/10 border-mystery-red text-mystery-text' 
                    : 'bg-black/30 border-[#3a332a] text-mystery-textSecondary hover:border-[#4a4238]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    selectedSuspect === suspect.id ? 'border-mystery-red' : 'border-[#4a4238]'
                  }`}>
                    {selectedSuspect === suspect.id && <div className="w-2 h-2 rounded-full bg-mystery-red" />}
                  </div>
                  <span className="font-case text-lg">{suspect.name}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="block font-typewriter text-mystery-brass uppercase tracking-widest text-sm">
            2. Explain your reasoning
          </label>
          <textarea
            value={motive}
            onChange={(e) => setMotive(e.target.value)}
            placeholder="Based on the clues and testimonies, I accuse them because..."
            rows={4}
            className="w-full bg-black/40 border border-[#3a332a] rounded p-4 text-mystery-text placeholder-mystery-textSecondary/40 focus:outline-none focus:border-mystery-brass font-case resize-none custom-scrollbar"
          />
        </div>

        <button
          type="submit"
          className="w-full py-4 bg-mystery-red hover:bg-red-800 text-white font-typewriter uppercase tracking-widest rounded shadow-lg transition-colors"
        >
          Lock In Accusation
        </button>
      </form>
    </div>
  );
}
