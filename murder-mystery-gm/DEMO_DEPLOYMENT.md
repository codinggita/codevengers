# Remote Demo Deployment Guide

This guide provides a repeatable, 5-minute process to go from "laptop closed" to a publicly reachable multiplayer game that remote judges can join, while keeping the AI running locally on your hardware.

**Architecture Overview:**
- **Frontend**: React + Vite, deployed globally on Vercel.
- **Backend**: Express + Socket.io, running locally on your Windows machine.
- **AI Engine**: Ollama, running locally on your Windows machine.
- **Tunneling**: Ngrok, routing public traffic to your local backend securely.

---

## One-Time Setup

You only need to do this once before your first demo.

### 1. Vercel Setup
1. Push your code to a GitHub repository.
2. Go to [Vercel](https://vercel.com) and import the repository.
3. Configure the **Framework Preset** as `Vite`.
4. In the **Environment Variables** section, add:
   - `VITE_BACKEND_URL` = `https://placeholder-url.ngrok-free.app` *(we will change this later)*
5. Click **Deploy**. Vercel will give you a public URL (e.g., `https://murder-mystery-gm.vercel.app`).
6. Update your local backend: In `backend/.env` (or via your execution environment), set `CLIENT_ORIGIN` to this Vercel URL.

### 2. Ngrok Setup
1. Go to [ngrok.com](https://ngrok.com) and create a free account.
2. Download the Windows zip file, extract `ngrok.exe`, and place it somewhere in your PATH (or in the project root).
3. Authenticate your machine by copying the authtoken command from your ngrok dashboard:
   ```powershell
   ngrok config add-authtoken <your-auth-token>
   ```

---

## 🚀 Every-Demo Checklist

Run these steps ~5 minutes before your demo begins.

1. **Keep Windows Awake**: Ensure your laptop is plugged in and sleep/lock settings are disabled. If the computer sleeps, the tunnel collapses and the game goes offline.
2. **Close Existing Instances**: Close any stray terminal windows running the backend, frontend, or ngrok from previous tests.
3. **Execute the Startup Script**: Open PowerShell as an Administrator (to ensure execution policies allow scripts) and run the automated startup script:
   ```powershell
   # If execution policy blocks it, run: Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   .\start-demo.ps1
   ```
4. **Update Vercel**:
   - The script will copy the new Ngrok URL to your clipboard.
   - Go to your Vercel Project -> **Settings** -> **Environment Variables**.
   - Edit `VITE_BACKEND_URL` and paste the new URL. Save it.
   - Go to the **Deployments** tab, click the three dots on the latest deployment, and click **Redeploy**.

---

## Manual Verification (Crucial!)

Do not assume it works just because the script finished. Test the connection from an **external network** (like a phone disconnected from Wi-Fi).

1. **Verify Backend Reachability**:
   - On your phone's browser, visit your Ngrok URL appended with `/health` (e.g., `https://abcd1234.ngrok-free.app/health`).
   - *Expected:* You should see `{"status":"ok","service":"murder-mystery-gm-backend"}`.
   - *If you see an Ngrok warning page*, click "Visit Site" to bypass the browser warning.
2. **Verify Frontend Connectivity**:
   - On your phone's browser, visit the **Vercel URL** (e.g., `https://murder-mystery-gm.vercel.app`).
   - Create a room and see if you connect seamlessly.
   - *Expected:* You should see your name pop up in the lobby instantly.

---

## ⚠️ Troubleshooting Guide

| Symptom / Error | Probable Cause | Fix |
| :--- | :--- | :--- |
| **Script fails at `[1/5]` (Ollama)** | Ollama isn't running. | Open the "Ollama" app from your Windows Start Menu, or run `ollama serve` in a terminal. |
| **Script fails at `[2/5]` (Backend)** | Port 4000 is already in use. | A previous Node process is stuck. Run `Stop-Process -Name "node" -Force` in PowerShell. |
| **Script fails at `[5/5]` (Reachability)** | Windows Firewall is blocking Node/Ngrok, or the backend crashed. | Look at the specific backend terminal window that the script opened for crash logs. Allow Node/Ngrok through the firewall. |
| **"ERR_EMPTY_RESPONSE" on Vercel** | The Vercel app has an old, stale Ngrok URL. | You forgot to update `VITE_BACKEND_URL` in Vercel and redeploy after starting the script. |
| **Socket connection failing (Network Tab)**| The free Ngrok tier intercepts traffic with a browser warning page. | Open the Ngrok URL manually in your browser *once* and click "Visit Site" to accept the warning, then refresh the Vercel page. |
| **Everything drops mid-demo** | The Windows machine went to sleep, or internet dropped. | Wake the machine. Restart the script. Redeploy Vercel with the new URL. **Keep the laptop awake!** |
