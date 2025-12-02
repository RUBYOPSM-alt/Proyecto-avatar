import fs from "fs";
import path from "path";
import crypto from "crypto";

const CANDIDATE_DIR = path.resolve("server/learning/candidates");

export function storeCandidate(text, metadata = {}) {
  if (!text) return;
  const id = crypto.randomUUID();
  const file = path.join(CANDIDATE_DIR, `${id}.json`);
  const payload = {
    id,
    text,
    source: "conversation",
    metadata,
    timestamp: Date.now()
  };
  fs.writeFileSync(file, JSON.stringify(payload, null, 2));
  return id;
}

export function getCandidates() {
  return fs
    .readdirSync(CANDIDATE_DIR)
    .filter(f => f.endsWith(".json"))
    .map(f => JSON.parse(fs.readFileSync(path.join(CANDIDATE_DIR, f))));
}

export function deleteCandidate(id) {
  const file = path.join(CANDIDATE_DIR, `${id}.json`);
  if (fs.existsSync(file)) fs.unlinkSync(file);
}
