import { useState, useEffect } from 'react';
import { socket } from './socket';

function AdminTest() {
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Listen to all socket events strictly for debugging
    const onAnyEvent = (eventName, ...args) => {
      console.log(`[Admin socket.onAny] ${eventName}`, args);
      if (eventName === 'characterAssigned') {
        setLoading(false);
        setGameData(prev => ({
          ...prev,
          characterAssignedEvent: args[0]
        }));
      }
    };
    
    socket.onAny(onAnyEvent);
    
    return () => {
      socket.offAny(onAnyEvent);
    };
  }, []);

  const startTestGame = () => {
    setLoading(true);
    setGameData(null);
    
    // We create a room first so the socket joins it
    const testRoom = "TEST_ADMIN_" + Math.floor(Math.random() * 1000);
    socket.emit('createRoom', testRoom);
    
    // Wait for room to be created, then start game
    setTimeout(() => {
      socket.emit('startGame', { roomCode: testRoom });
    }, 1000);
  };

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold text-red-500 mb-6">Game Master Admin Panel</h1>
      
      <button 
        onClick={startTestGame}
        disabled={loading}
        className={`px-6 py-3 rounded-lg font-semibold ${loading ? 'bg-gray-600' : 'bg-red-600 hover:bg-red-700'} text-white transition-colors`}
      >
        {loading ? "Generating Mystery (Check backend logs)..." : "Test Phase 2 - Generate Mystery"}
      </button>

      {gameData && (
        <div className="mt-8 bg-black p-6 rounded-xl border border-gray-700 text-sm overflow-auto max-h-[80vh]">
          <h2 className="text-xl font-bold text-white mb-4">Received Payload (Check DevTools for full logs):</h2>
          <pre className="text-green-400">{JSON.stringify(gameData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default AdminTest;
