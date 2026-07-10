# # AI Game Master — Murder Mystery

Multiplayer web app where an AI acts as a dynamic Game Master for a murder mystery game.

## Repo Structure
```
murder-mystery-gm/
├── backend/     # Express + Socket.io server
└── frontend/    # React + Vite + Tailwind client
```

## Phase 0 Setup

### 1. Backend
```bash
cd backend
npm install
npm run dev
```
Server runs on `http://localhost:4000`.

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
Client runs on `http://localhost:5173`.

Open the frontend in your browser — you should see a "Connected to server ✅" status once both are running. That's the Phase 0 deliverable: frontend + backend talking over Socket.io.

### 3. Ollama (local LLM for the AI Game Master)
Ollama is a separate local install — it does not run inside this repo, so set it up directly on your machine:

```bash
# Install (macOS/Linux) — see https://ollama.com/download for Windows
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull llama3.2
# or, if you want something a bit stronger for reasoning-heavy GM responses:
ollama pull gemma2

# Start the server (usually auto-starts, but just in case)
ollama serve
```

By default Ollama exposes an OpenAI-ish API at `http://localhost:11434`. The backend's `.env` has a placeholder for this — see `backend/.env.example`.

**Demo-day tip:** local LLM latency/consistency can be a risk live on stage. Consider testing a hosted fallback (even a cheap hosted API) in Phase 2/3, or pre-baking as much of the mystery/clue structure as possible so the model only has to answer narrow, well-scoped questions at runtime rather than freeform ones.

## Team Role Mapping to This Scaffold
- **Member 1 (AI & Game Logic)** → will build on `backend/socket/index.js` and a new `backend/ai/` module for prompting Ollama (Phase 2/3)
- **Member 2 (Backend)** → owns `backend/` — game state, room codes, Socket.io events
- **Member 3 (Frontend)** → owns `frontend/src/` — lobby, chat, character card UI
- **Member 4 (Integration/Polish)** → works across both once features land, plus testing/demo prep

## Next Steps (Phase 1)
- Add `createRoom` / `joinRoom` Socket.io events
- Track players per room server-side (in-memory Map is fine for a hackathon)
- Build the Lobby screen in the frontend
