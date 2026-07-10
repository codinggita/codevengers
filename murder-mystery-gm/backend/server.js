import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { registerSocketHandlers } from './socket/index.js';

const PORT = process.env.PORT || 4000;

/** Comma-separated list, e.g. http://localhost:5173,https://your-app.vercel.app */
const ALLOWED_ORIGINS = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser tools (curl, health checks) with no Origin header
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⛔ CORS blocked origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed`));
    }
  },
  allowedHeaders: ['Content-Type', 'ngrok-skip-browser-warning'],
};

const app = express();
app.use(cors(corsOptions));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'murder-mystery-gm-backend' });
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    allowedHeaders: ['ngrok-skip-browser-warning'],
  },
});

registerSocketHandlers(io);

httpServer.listen(PORT, () => {
  console.log(`✅ Backend listening on http://localhost:${PORT}`);
  console.log(`   Accepting connections from: ${ALLOWED_ORIGINS.join(', ')}`);
});
