import { useEffect, useState } from 'react';
import { socket } from './socket';

export default function App() {
  const [connected, setConnected] = useState(socket.connected);
  const [pongReceived, setPongReceived] = useState(false);

  useEffect(() => {
    function onConnect() {
      setConnected(true);
      // Round-trip test: proves Socket.io messages actually flow both ways.
      socket.emit('ping', { hello: 'from frontend' });
    }
    function onDisconnect() {
      setConnected(false);
      setPongReceived(false);
    }
    function onPong() {
      setPongReceived(true);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('pong', onPong);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('pong', onPong);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-3xl font-bold text-mystery-accent tracking-wide">
        AI Game Master — Murder Mystery
      </h1>
      <p className="text-mystery-muted">Phase 0: connectivity check</p>

      <div className="bg-mystery-panel rounded-xl px-6 py-4 flex flex-col gap-2 items-center">
        <StatusRow label="Backend connection" ok={connected} />
        <StatusRow label="Socket.io round-trip (ping/pong)" ok={pongReceived} />
      </div>

      {connected && pongReceived && (
        <p className="text-sm text-mystery-muted">
          ✅ Phase 0 deliverable complete — build the Lobby next (Phase 1).
        </p>
      )}
    </div>
  );
}

function StatusRow({ label, ok }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span
        className={`inline-block w-2.5 h-2.5 rounded-full ${
          ok ? 'bg-green-500' : 'bg-red-500 animate-pulse'
        }`}
      />
      <span>{label}</span>
      <span className="text-mystery-muted">{ok ? 'connected ✅' : 'waiting…'}</span>
    </div>
  );
}
