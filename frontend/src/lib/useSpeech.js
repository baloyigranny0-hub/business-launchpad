// Browser Web Speech API hook — free, no API key.
// Returns: { supported, listening, transcript, start, stop, reset }
import { useEffect, useRef, useState, useCallback } from "react";

export default function useSpeech({ lang = "en-US", interim = true } = {}) {
  const SR = typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;
  const supported = !!SR;
  const recRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  useEffect(() => {
    if (!SR) return;
    const r = new SR();
    r.continuous = true;
    r.interimResults = interim;
    r.lang = lang;
    r.onresult = (e) => {
      let t = "";
      for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
      setTranscript((prev) => (prev + " " + t).trim());
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recRef.current = r;
    return () => { try { r.stop(); } catch (_) {} };
  }, [SR, interim, lang]);

  const start = useCallback(() => {
    if (!recRef.current || listening) return;
    setTranscript("");
    try { recRef.current.start(); setListening(true); } catch (_) {}
  }, [listening]);

  const stop = useCallback(() => {
    if (!recRef.current) return;
    try { recRef.current.stop(); } catch (_) {}
    setListening(false);
  }, []);

  const reset = useCallback(() => setTranscript(""), []);
  return { supported, listening, transcript, start, stop, reset };
}
