import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const STORE_PATH = path.join(process.cwd(), 'knowledge_store.json');
const OPENAI_EMBED_URL = 'https://api.openai.com/v1/embeddings';

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-12);
}

async function getEmbedding(text) {
  const resp = await fetch(OPENAI_EMBED_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text })
  });
  const j = await resp.json();
  if (!j.data || !j.data[0]) throw new Error('Embedding failed');
  return j.data[0].embedding;
}

function loadStore() {
  if (!fs.existsSync(STORE_PATH)) return [];
  const raw = fs.readFileSync(STORE_PATH, 'utf8');
  return JSON.parse(raw || '[]');
}

function saveStore(items) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(items, null, 2));
}

export async function ingestText(id, text) {
  const embedding = await getEmbedding(text);
  const store = loadStore();
  store.push({ id, text, embedding });
  saveStore(store);
  return true;
}

export async function ingestUrl(url, idPrefix = 'url_') {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('fetch failed');
  const html = await resp.text();
  const txt = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ');
  const parts = txt.match(/.{1,1500}/g) || [txt];
  let i = 0;
  for (const p of parts) {
    const id = idPrefix + Date.now() + '_' + (i++);
    await ingestText(id, p);
  }
  return parts.length;
}

export async function queryTopK(query, k = 5) {
  const emb = await getEmbedding(query);
  const store = loadStore();
  const scored = store.map(item => ({ id: item.id, text: item.text, score: cosine(emb, item.embedding) }));
  scored.sort((a,b) => b.score - a.score);
  return scored.slice(0,k);
}

export function clearStore() { saveStore([]); }
