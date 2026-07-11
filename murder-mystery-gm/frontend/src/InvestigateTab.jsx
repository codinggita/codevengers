import { useState, useEffect, useRef } from 'react';
import { socket } from './socket';
import { Search, ChevronRight, FileSearch, Sparkles, Mic } from 'lucide-react';
import { speakGameMaster } from './utils/speech';
import { useTheme } from './themes/ThemeProvider';

export default function InvestigateTab({ sharedClues, typingPlayers, setGmSpeaking }) {
  const theme = useTheme();
  const EvidenceIcon = theme?.icons.evidence;
  const [input, setInput] = useState('');
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'system', text: 'The Game Master awaits your actions. Type what you want to investigate.' }
  ]);
  
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    function onInvestigateResponse({ actionText, flavorText, clue }) {
      setIsInvestigating(false);
      socket.emit('playerTyping', { isTyping: false });
      
      speakGameMaster(
        flavorText,
        () => setGmSpeaking?.(true),
        () => setGmSpeaking?.(false)
      );

      setMessages(prev => [
        ...prev, 
        { type: 'user', text: actionText },
        { type: 'gm', text: flavorText, isClue: !!clue }
      ]);
    }
    
    function onGameError({ message }) {
      setIsInvestigating(false);
      socket.emit('playerTyping', { isTyping: false });
      speakGameMaster(
        message,
        () => setGmSpeaking?.(true),
        () => setGmSpeaking?.(false)
      );
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
    if (e?.preventDefault) e.preventDefault();
    if (!input.trim() || isInvestigating) return;

    socket.emit('investigateAction', { actionText: input.trim() });
    socket.emit('playerTyping', { isTyping: true });
    setIsInvestigating(true);
    setInput('');
  };

  const recognitionRef = useRef(null);

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition || isRecording || isInvestigating) return;

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        
        // Auto-submit recognized transcript
        socket.emit('investigateAction', { actionText: transcript.trim() });
        socket.emit('playerTyping', { isTyping: true });
        setIsInvestigating(true);
        setInput('');
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }

    try {
      recognitionRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
    }
  };

  const stopRecordingAndSubmit = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop(); // This triggers onresult automatically if speech was detected
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.abort(); // Stops and prevents onresult
      setIsRecording(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-140px)] max-w-6xl mx-auto w-full font-case px-4 pt-4 pb-2">
      
      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0">
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
      <div className="shrink-0 relative">
        {/* Presence Indicator */}
        {Object.keys(typingPlayers).length > 0 && (
          <div className="absolute -top-6 left-2 text-xs font-typewriter italic text-mystery-textSecondary/70 transition-opacity animate-pulse">
            {Object.values(typingPlayers).join(', ')} {Object.keys(typingPlayers).length === 1 ? 'is' : 'are'} investigating...
          </div>
        )}
        <form onSubmit={handleSubmit} className="relative">
        
        {/* Mic Button (fallback gracefully if not supported) */}
        {('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) && (
          <button
            type="button"
            onMouseDown={startRecording}
            onMouseUp={stopRecordingAndSubmit}
            onMouseLeave={cancelRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecordingAndSubmit}
            className={`absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors ${
              isRecording ? 'text-mystery-red bg-mystery-red/10 animate-pulse' : 'text-mystery-brass hover:bg-mystery-brass/10 hover:text-yellow-400'
            }`}
            title="Hold to speak"
          >
            <Mic className="w-5 h-5" />
          </button>
        )}

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. 'Search the victim's pockets' or 'Ask the maid about the argument'"
          disabled={isInvestigating || isRecording}
          className={`w-full bg-[#161310] border border-[#3a332a] rounded py-4 pr-12 text-mystery-text placeholder-mystery-textSecondary/40 focus:outline-none focus:border-mystery-brass transition-colors font-case disabled:opacity-50 ${
            ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) ? 'pl-14' : 'pl-4'
          }`}
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
      </div>

      {/* Side Panel: Evidence Board */}
      <div className="theme-gift-table hidden md:flex flex-col w-80 bg-[#161310] border border-[#2a251e] rounded shadow-2xl p-4 shrink-0 overflow-y-auto custom-scrollbar relative">
        <div className="theme-gift-table-header flex items-center space-x-2 text-mystery-brass mb-6 pb-2">
          {EvidenceIcon ? <EvidenceIcon className="w-5 h-5" /> : <FileSearch className="w-5 h-5" />}
          <h3 className="font-typewriter uppercase tracking-widest text-sm">
            {theme?.labels?.evidenceBoard || 'Evidence Board'}
          </h3>
        </div>
        <div className="space-y-4">
          {sharedClues.map(clue => (
            <div key={clue.id} className="theme-gift-tag relative p-4 bg-[#fffdf0] border border-[#d6d0c4] rounded-sm shadow-[2px_3px_5px_rgba(0,0,0,0.4)] text-black animate-pin-drop">
              <div className="theme-ribbon-tag" aria-hidden="true" />
              
              <p className="text-sm font-medium leading-snug font-serif mt-2">{clue.description}</p>
              <p className="text-[10px] text-gray-500 mt-3 font-typewriter italic uppercase tracking-wider text-right border-t border-black/10 pt-1">
                Found by {clue.discoveredBy}
              </p>
            </div>
          ))}
          {sharedClues.length === 0 && (
            <div className="text-center text-mystery-textSecondary font-typewriter text-sm italic mt-8">
              No solid evidence found yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
