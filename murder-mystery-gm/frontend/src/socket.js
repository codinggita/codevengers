import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

// Single shared socket instance for the whole app.
// Import this wherever you need to emit/listen instead of creating new connections.
export const socket = io(BACKEND_URL, {
  autoConnect: true,
  // Required for ngrok free-tier: bypasses the interstitial warning page
  // that otherwise intercepts requests and strips CORS headers.
  extraHeaders: {
    "ngrok-skip-browser-warning": "true",
  },
});
