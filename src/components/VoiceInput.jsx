// src/components/VoiceInput.jsx
import React, { useEffect, useRef, useState } from "react";
import { parseCommand } from "../utils/commandParser";

const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;

export default function VoiceInput({ onCommand }) {
  const [supported] = useState(!!SR);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [lang, setLang] = useState("en-US");
  const recRef = useRef(null);

  useEffect(() => {
    if (!SR) return;
    const r = new SR();
    r.lang = lang;
    r.interimResults = false;
    r.maxAlternatives = 1;

    r.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      const parsed = parseCommand(text);
      onCommand?.(parsed);
    };
    r.onerror = (e) => {
      console.error("[SpeechError]", e);
      setListening(false);
    };
    r.onend = () => setListening(false);

    recRef.current = r;
    return () => {
      try {
        r.abort();
      } catch (_) {}
    };
  }, [lang, onCommand]);

  function toggle() {
    if (!supported) return;
    if (!listening) {
      try {
        setTranscript("");
        recRef.current?.start();
        setListening(true);
      } catch (e) {
        console.error(e);
        setListening(false);
      }
    } else {
      try {
        recRef.current?.stop();
      } catch (_) {}
      setListening(false);
    }
  }

  // Manual input mode for fallback when voice input is not available
  const [manual, setManual] = useState("");
  function submitManual(e) {
    e.preventDefault();
    if (!manual.trim()) return;
    setTranscript(manual.trim());
    const parsed = parseCommand(manual.trim());
    onCommand?.(parsed);
    setManual("");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {/* Language selection dropdown */}
        <select
          className="border rounded px-2 py-1 text-sm"
          value={lang}
          onChange={(e) => setLang(e.target.value)}
        >
          <option value="en-US">English (US)</option>
          <option value="en-GB">English (UK)</option>
          <option value="hi-IN">Hindi (India)</option>
          <option value="bn-IN">Bengali (India)</option>
        </select>

        {/* Voice toggle button */}
        <button
          onClick={toggle}
          className={`relative w-12 h-12 rounded-full flex items-center justify-center transition 
            ${listening ? "bg-red-500" : "bg-indigo-600"} text-white`}
        >
          {listening ? "■" : "🎤"}
          {listening && (
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
          )}
        </button>

        {!supported && (
          <span className="text-xs text-amber-600">
            Mic not supported in this browser.
          </span>
        )}
      </div>

      {/* Display transcript */}
      <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded shadow-sm">
        <span className="font-medium">Transcript:</span>{" "}
        {transcript || "—"}
      </div>

      {/* Manual text command input */}
      <form onSubmit={submitManual} className="flex items-center gap-2">
        <input
          className="flex-1 border rounded px-3 py-2"
          placeholder='Type command (e.g., "add 2 milk")'
          value={manual}
          onChange={(e) => setManual(e.target.value)}
        />
        <button
          className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition"
          type="submit"
        >
          Run
        </button>
      </form>
    </div>
  );
}
