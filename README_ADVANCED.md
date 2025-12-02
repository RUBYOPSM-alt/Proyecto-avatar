
# Imagym Avatar — Production Template (Advanced README)

## Overview
This repository contains a full production-ready virtual avatar assistant for ImaGym 24h.
It includes:
- Backend (Node.js) with WebSocket, RAG (OpenAI embeddings), STT (OpenAI), TTS (ElevenLabs streaming with timestamps)
- Frontend (React + Vite) with avatar UI, microphone capture, lip-sync (viseme-based), and admin dashboard
- Auto-learning pipeline (candidate extraction and admin approval)
- Deployment guides for Render (backend) and Vercel (frontend)

## Quick start (developer)
1. Copy `.env.example` to `server/.env` and `web/.env` if needed. Fill in API keys:
   - `OPENAI_API_KEY`
   - `ELEVEN_API_KEY`
   - `ELEVEN_VOICE_ID`
   - `ADMIN_API_KEY` (choose a strong key)

2. Install dependencies:
   - Backend: `cd server && npm install`
   - Frontend: `cd web && npm install`

3. Start services (development):
   - Backend: `cd server && npm run dev`
   - Frontend: `cd web && npm run dev`

4. Populate knowledge base (RAG):
   - `curl -X POST https://your-backend/admin/ingest-site -H "x-admin-key: <ADMIN_API_KEY>"`

## Admin Dashboard (developer)
The Admin Dashboard component is in `web/src/admin/AdminDashboard.jsx`.
It connects to admin REST endpoints to list learning candidates, approve/reject them, and trigger reindexing.

Admin endpoints (example):
- `GET /admin/learning/candidates` — list candidate items
- `POST /admin/learning/approve` — approve a candidate (body: { id })
- `DELETE /admin/learning/candidate/:id` — reject/delete a candidate
- `POST /admin/ingest-site` — trigger website ingestion (requires x-admin-key header)

## Deployment
See `deploy/production_deploy.md` for complete Render and Vercel instructions.

## Security
- Keep `.env` out of the repo.
- Use a strong `ADMIN_API_KEY` and rotate it when needed.
- Add rate limiting on admin endpoints in production.
- Protect RAG ingestion endpoints using authentication and content validation.

## Contributing
- Use feature branches and PRs.
- Run linters (`eslint`) and tests before merging.
- Document changes in CHANGELOG.md

## Support
If you need help with deployment or customization, contact the maintainers or request support from the Imagym dev team.
