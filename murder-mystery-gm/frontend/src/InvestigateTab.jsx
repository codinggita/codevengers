import { useState, useEffect, useRef } from 'react';
import { socket } from './socket';
import { Search, ChevronRight, FileSearch, Sparkles } from 'lucide-react';

export default function InvestigateTab({ sharedClues }) {
  const [input, setInput] = useState('');
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'system', text: 'The Game Master awaits your actions. Type what you want to investigate.' }
  ]);
  
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    function onInvestigateResponse({ actionText, flavorText, clue }) {
      setIsInvestigating(false);
      setMessages(prev => [
        ...prev, 
        { type: 'user', text: actionText },
        { type: 'gm', text: flavorText, isClue: !!clue }
      ]);
    }
    
    function onGameError({ message }) {
      setIsInvestigating(false);
      setMessages(prev => [
        ...prev,
        { type: 'error', text: message }
      ]);
    }

    socket.on('investigateResponse', onInvestigateResponse);
    socket.on('gameError', onGameError);

    return () => {
      socket.off('investigateResponse', onInvestigateResponse);
      socket.off('gameError', onGameError);
    };
  }, []);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isInvestigating) return;

    socket.emit('investigateAction', { actionText: input.trim() });
    setIsInvestigating(true);
    setInput('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[600px] max-w-4xl mx-auto w-full font-case px-4 pt-4 pb-2">
      
      {/* Top Section: Shared Clues */}
      {sharedClues.length > 0 && (
        <div className="mb-4 bg-[#161310] border border-[#2a251e] rounded p-4 shadow-lg shrink-0">
          <div className="flex items-center space-x-2 text-mystery-brass mb-3">
            <FileSearch className="w-5 h-5" />
            <h3 className="font-typewriter uppercase tracking-widest text-sm">Discovered Clues</h3>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
            {sharedClues.map(clue => (
              <div key={clue.id} className="p-3 bg-black/40 border border-[#3a332a] rounded">
                <p className="text-sm text-mystery-text">{clue.description}</p>
                <p className="text-xs text-mystery-textSecondary/60 mt-1 font-typewriter italic">
                  Found by {clue.discoveredBy}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto mb-4 bg-black/20 border border-[#2a251e] rounded p-4 custom-scrollbar">
        <div className="space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded p-3 ${
                msg.type === 'user' 
                  ? 'bg-mystery-red/20 border border-mystery-red/30 text-mystery-text' 
                  : msg.type === 'error'
                  ? 'bg-red-900/40 border border-red-500/50 text-red-200'
                  : 'bg-[#161310] border border-[#3a332a] text-mystery-textSecondary'
              }`}>
                
                {msg.type === 'gm' && msg.isClue && (
                  <div className="flex items-center text-mystery-brass text-xs font-typewriter mb-2 uppercase tracking-wide">
                    <Sparkles className="w-3 h-3 mr-1" />
                    <span>New Clue Found</span>
                  </div>
                )}
                
                {msg.type === 'system' && (
                  <div className="flex items-center text-mystery-brass text-xs font-typewriter mb-2 uppercase tracking-wide">
                    <span>System</span>
                  </div>
                )}

                <p className={`whitespace-pre-wrap ${msg.type === 'user' ? 'font-typewriter text-sm' : 'text-base leading-relaxed'}`}>
                  {msg.text}
                </p>
              </div>
            </div>
          ))}

          {isInvestigating && (
            <div className="flex justify-start">
              <div className="bg-[#161310] border border-[#3a332a] text-mystery-textSecondary rounded p-4 max-w-[85%] flex items-center space-x-3">
                <Search className="w-4 h-4 animate-pulse text-mystery-brass" />
                <span className="font-typewriter text-sm animate-pulse tracking-wide">
                  The Game Master is investigating...
                </span>
              </div>
            </div>
          )}
          
          <div ref={endOfMessagesRef} />
        </div>
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="shrink-0 relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. 'Search the victim's pockets' or 'Ask the maid about the argument'"
          disabled={isInvestigating}
          className="w-full bg-[#161310] border border-[#3a332a] rounded py-4 pl-4 pr-12 text-mystery-text placeholder-mystery-textSecondary/40 focus:outline-none focus:border-mystery-brass transition-colors font-case disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isInvestigating || !input.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-mystery-brass hover:text-yellow-400 disabled:opacity-50 transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </form>
    </div>
  );
}
