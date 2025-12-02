import { WS_URL, AVATAR_PATH } from './config.js';
import React, { useEffect, useRef, useState } from 'react';

export default function AvatarFullRealtime({ wsUrl = WS_URL, avatarUrlProp = AVATAR_PATH }) {
  const [avatarUrl, setAvatarUrl] = useState(avatarUrlProp);
  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState('idle');
  const visemesRef = useRef([]);
  const [mouth, setMouth] = useState(0);
  const [expression, setExpression] = useState('neutral');

  useEffect(() => {
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => console.log('WS open');
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'audio-chunk') {
          playBase64Audio(msg.data);
        } else if (msg.type === 'alignment') {
          visemesRef.current = msg.data;
        } else if (msg.type === 'reply') {
          console.log('Reply text:', msg.text);
        } else if (msg.type === 'transcript') {
          console.log('Transcript:', msg.text);
        } else if (msg.type === 'done') {
          setStatus('idle');
        }
      } catch (e) { console.error(e); }
    };
    wsRef.current = ws;
    return () => ws.close();
  }, [wsUrl]);

  async function playBase64Audio(b64) {
    try {
      const raw = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioCtx.decodeAudioData(raw.buffer);
      const src = audioCtx.createBufferSource();
      src.buffer = audioBuffer; src.connect(audioCtx.destination); src.start();
    } catch (e) { console.error('play error', e); }
  }

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    mediaRecorderRef.current = mr;
    const ws = wsRef.current;
    mr.ondataavailable = (ev) => { if (ev.data && ev.data.size > 0) ws.send(ev.data); };
    mr.onstop = () => { ws.send(JSON.stringify({ type: 'media-end' })); };
    mr.start(250);
    setRecording(true); setStatus('recording');
  };
  const stopRecording = () => { const mr = mediaRecorderRef.current; if (mr && mr.state !== 'inactive') mr.stop(); setRecording(false); setStatus('processing'); };

  useEffect(() => {
    let raf;
    const loop = () => {
      const audioEl = document.querySelector('audio');
      const now = audioEl ? audioEl.currentTime : performance.now()/1000;
      const v = visemesRef.current.find(v => now >= v.start && now <= v.end);
      if (v) {
        const vowels = (v.text.match(/[aeiouáéíóúü]/gi) || []).length;
        const len = v.text.length; const openness = Math.min(1, (vowels/Math.max(1,len))*1.8);
        setMouth(openness);
      } else setMouth(0);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const sendText = (text) => { if (!wsRef.current) return; wsRef.current.send(JSON.stringify({ type: 'speak', text })); setStatus('tts'); };

  const handleAvatarUpload = (file) => { const url = URL.createObjectURL(file); setAvatarUrl(url); };

  return (
    <div style={{ display: 'flex', gap: 20 }}>
      <div style={{ position: 'relative', width: 260 }}>
        <img src={avatarUrl} alt="avatar" style={{ width: '100%', borderRadius: 16, filter: expression === 'smile' ? 'brightness(1.02)' : 'none' }} />
        <div style={{ position:'absolute', left:'50%', bottom:40, transform:'translateX(-50%)'}}>
          <div style={{ width:120, height: 8 + mouth*28, background:'rgba(0,0,0,0.12)', borderRadius:40, transition:'height 60ms linear' }} />
        </div>
      </div>

      <div style={{ flex:1 }}>
        <div style={{ marginBottom:8 }}>
          <input id="txt3" placeholder="Escribe..." style={{ width:'60%', padding:8 }} />
          <button onClick={() => { const t = document.getElementById('txt3').value; sendText(t); }} style={{ marginLeft:8 }}>Enviar texto</button>
        </div>

        <div style={{ marginBottom:8 }}>
          <button onClick={() => recording ? stopRecording() : startRecording()}>{recording ? 'Detener' : 'Hablar'}</button>
          <span style={{ marginLeft:12 }}>{status}</span>
        </div>

        <div>
          <input type="file" accept="image/*" onChange={(e) => handleAvatarUpload(e.target.files[0])} />
        </div>

        <audio controls style={{ marginTop:12 }} />
      </div>
    </div>
  );
}
