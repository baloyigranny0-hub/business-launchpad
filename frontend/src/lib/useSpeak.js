// Tiny browser TTS wrapper using SpeechSynthesis (free, native).
// Returns { supported, speak, stop, speaking }.
import { useEffect, useState, useRef, useCallback } from "react";

const SS = typeof window !== "undefined" ? window.speechSynthesis : null;

export default function useSpeak() {
  const supported = !!SS;
  const [speaking, setSpeaking] = useState(false);
  const utterRef = useRef(null);

  useEffect(() => () => {
    try { SS?.cancel(); } catch (e) { /* ignore */ }
  }, []);

  const speak = useCallback((text) => {
    if (!SS || !text) return;
    try {
      SS.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.0;
      u.pitch = 1.0;
      u.lang = "en-US";
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      utterRef.current = u;
      SS.speak(u);
      setSpeaking(true);
    } catch (err) { setSpeaking(false); }
  }, []);

  const stop = useCallback(() => {
    try { SS?.cancel(); } catch (e) { /* ignore */ }
    setSpeaking(false);
  }, []);

  return { supported, speak, stop, speaking };
}
