import React from "react";
import { Microphone, Stop } from "@phosphor-icons/react";

/** Small mic button. Tap to start, tap to stop. Pushes captured words via onPush(text). */
export default function MicButton({ onPush, color = "#D4AF37", testid = "mic-btn", size = 16 }) {
  const SR = typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;
  const [listening, setListening] = React.useState(false);
  const recRef = React.useRef(null);
  const finalRef = React.useRef("");

  if (!SR) return null;

  const start = () => {
    const r = new SR();
    r.continuous = false;
    r.interimResults = true;
    r.lang = "en-US";
    finalRef.current = "";
    r.onresult = (e) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      finalRef.current = t;
    };
    r.onend = () => {
      setListening(false);
      if (finalRef.current.trim()) onPush(finalRef.current.trim());
    };
    r.onerror = () => setListening(false);
    recRef.current = r;
    try { r.start(); setListening(true); } catch (_) { setListening(false); }
  };

  const stop = () => { try { recRef.current?.stop(); } catch (_) {} setListening(false); };

  return (
    <button
      type="button"
      data-testid={testid}
      onClick={listening ? stop : start}
      title={listening ? "Stop listening" : "Speak"}
      className={`p-2 rounded-full transition ${listening ? "animate-pulse" : ""}`}
      style={{
        background: listening ? color : "transparent",
        color: listening ? "#0A0F1A" : color,
        border: `1px solid ${color}55`,
      }}
    >
      {listening ? <Stop size={size} weight="fill" /> : <Microphone size={size} weight="fill" />}
    </button>
  );
}
