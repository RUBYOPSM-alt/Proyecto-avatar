import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { ingestUrl, ingestText, queryTopK, clearStore } from './knowledge.js';
import { streamTextToSpeechWithTimestamps } from './elevenTTS.js';

const app = express();
app.use(express.json());

// Basic admin auth middleware
app.use('/admin', (req, res, next) => {
  const key = req.headers['x-admin-key'] || req.query.admin_key;
  if (process.env.ADMIN_API_KEY && key !== process.env.ADMIN_API_KEY) return res.status(403).json({ error: 'forbidden' });
  next();
});

app.post('/admin/ingest-site', async (req, res) => {
  try {
    const n1 = await ingestUrl('https://imagym.es', 'imagym_home_');
    res.json({ ok: true, parts: n1 });
  } catch (e) { res.status(500).json({ ok:false, error: e.message }); }
});

app.post('/admin/clear-knowledge', (req,res) => { clearStore(); res.json({ ok:true }); });

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

function systemPromptLimitToImagym() {
  return `Eres un asistente de soporte que SOLO utiliza información del conjunto de documentos de conocimiento provistos (Imagym.es). Si la respuesta no se encuentra en esos documentos, responde: "Lo siento, no dispongo de información en Imagym.es sobre ese punto. ¿Quieres que busque o subas material adicional?". No inventes respuestas fuera del dominio.`;
}

async function callChatGPTWithContext(userText, docs) {
  const system = systemPromptLimitToImagym();
  const context = docs.map((d,i) => `Documento ${i+1} (score:${d.score.toFixed(3)}):\n${d.text}`).join('\n\n');
  const prompt = `${system}\n\nContexto relevante:\n${context}\n\nPregunta del usuario:\n${userText}`;

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{role:'system', content: system}, {role:'user', content: prompt}], max_tokens: 600 })
  });
  const j = await resp.json();
  return j.choices && j.choices[0] && j.choices[0].message.content;
}

async function transcribeAudioFile(filepath) {
  const url = 'https://api.openai.com/v1/audio/transcriptions';
  const form = new FormData();
  form.append('file', fs.createReadStream(filepath));
  form.append('model', 'whisper-1');
  const res = await fetch(url, { method: 'POST', headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }, body: form });
  const j = await res.json();
  return j.text;
}

async function streamTTSAndForward(ws, text) {
  await streamTextToSpeechWithTimestamps(text, {
    onAudioChunk: (b64) => ws.send(JSON.stringify({ type:'audio-chunk', data: b64 })),
    onAlignment: (alignment) => ws.send(JSON.stringify({ type:'alignment', data: alignment })),
    onDone: () => ws.send(JSON.stringify({ type:'done' }))
  });
}

// temp storage
const tmpDir = path.join(process.cwd(), 'tmp'); if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

wss.on('connection', (ws) => {
  ws.on('message', async (data) => {
    if (typeof data === 'string') {
      try {
        const msg = JSON.parse(data);
        if (msg.type === 'register') { ws.clientId = msg.clientId || Date.now().toString(); ws.send(JSON.stringify({ type:'registered', clientId: ws.clientId })); }
        else if (msg.type === 'media-end') {
          const files = fs.readdirSync(tmpDir).filter(f => f.startsWith(ws.clientId)).sort();
          if (files.length === 0) { ws.send(JSON.stringify({ type:'error', message: 'no audio' })); return; }
          const file = path.join(tmpDir, files[files.length-1]);
          ws.send(JSON.stringify({ type:'info', message: 'Transcribing audio...' }));
          const text = await transcribeAudioFile(file);
          ws.send(JSON.stringify({ type:'transcript', text }));

          const docs = await queryTopK(text, 5);
          const reply = await callChatGPTWithContext(text, docs);

          ws.send(JSON.stringify({ type:'reply', text: reply }));
          await streamTTSAndForward(ws, reply);
        } else if (msg.type === 'speak' && msg.text) {
          const docs = await queryTopK(msg.text, 5);
          const reply = await callChatGPTWithContext(msg.text, docs);
          ws.send(JSON.stringify({ type:'reply', text: reply }));
          await streamTTSAndForward(ws, reply);
        }
      } catch (e) {
        console.error('msg parse error', e);
        ws.send(JSON.stringify({ type:'error', message: e.message }));
      }
    } else {
      const buf = Buffer.from(data);
      const filename = path.join(tmpDir, `${ws.clientId || 'anon'}-${Date.now()}.webm`);
      fs.appendFileSync(filename, buf);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log('Server running on', PORT));
