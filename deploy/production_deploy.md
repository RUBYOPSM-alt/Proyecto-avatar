# Deploy Production - Imagym Avatar (Render + Vercel)

## Backend (Render)
1. Create a new Web Service on Render linking your repo and set the root to `/server`.
2. Build command: `npm install`
3. Start command: `npm run start` (or `npm run dev` for dev)
4. Set environment variables in Render dashboard:
   - OPENAI_API_KEY
   - ELEVEN_API_KEY
   - ELEVEN_VOICE_ID
   - ADMIN_API_KEY (choose a strong value)
   - PORT (optional; Render sets it automatically)
5. Add a persistent Disk in Render:
   - Mount path: `/var/data`
   - Use this path for RAG_DB_PATH if needed
6. After deploy, note your service URL (https://your-backend.onrender.com). Use `wss://` for WebSocket.

## Frontend (Vercel)
1. Import the project and set the root directory to `/web`.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Add environment variable:
   - VITE_WS_URL = wss://your-backend.onrender.com
5. Deploy. Your frontend will be live on *.vercel.app

## Final checks
- Test WebSocket connection from frontend to backend (browser console).
- Trigger POST /admin/ingest-site on backend to populate RAG.
- Upload additional PDFs via admin endpoints if available.

