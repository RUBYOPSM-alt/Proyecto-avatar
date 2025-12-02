import fetch from 'node-fetch';

const ElevenBase = 'https://api.elevenlabs.io/v1';

export async function streamTextToSpeechWithTimestamps(text, { onAudioChunk, onAlignment, onDone }) {
  const apiKey = process.env.ELEVEN_API_KEY;
  if (!apiKey) throw new Error('Missing ELEVEN_API_KEY');
  const voice = process.env.ELEVEN_VOICE_ID || 'eleven_monolingual_v1';
  const url = `${ElevenBase}/text-to-speech/${voice}/stream?with_timestamps=true`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({ text })
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`ElevenLabs TTS error: ${res.status} ${txt}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    try {
      const maybeText = decoder.decode(value, { stream: true });
      const trimmed = maybeText.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          const obj = JSON.parse(trimmed);
          if (obj.alignment) onAlignment && onAlignment(obj.alignment);
          else onAlignment && onAlignment(obj);
        } catch(e) {}
      } else {
        const b64 = Buffer.from(value).toString('base64');
        onAudioChunk && onAudioChunk(b64);
      }
    } catch(e) {
      const b64 = Buffer.from(value).toString('base64');
      onAudioChunk && onAudioChunk(b64);
    }
  }
  onDone && onDone();
}
