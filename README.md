Imagym Avatar — Full project
===========================

Contenido:
- server/: backend (WS, STT, RAG, ElevenLabs TTS streaming)
- web/: frontend React (Avatar component, mic capture, lip-sync)

Pasos rápidos:
1. Copia .env.example -> server/.env y completa las claves.
2. Instala dependencias:
   - cd server && npm install
   - cd ../web && npm install
3. Inicia backend: cd server && npm run dev
4. Inicia frontend: cd web && npm run dev
5. Abre frontend en http://localhost:5173

Notas:
- Asegúrate de usar un host que soporte WebSockets para producción.
- El pipeline usa embeddings OpenAI para RAG; para un índice grande, usa FAISS o servicio vector DB.


## Production Deployment Summary
See deploy/production_deploy.md for step-by-step instructions to deploy backend on Render and frontend on Vercel.
