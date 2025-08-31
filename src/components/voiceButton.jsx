// src/components/VoiceButton.jsx
import { Mic, Square } from "lucide-react";

export default function VoiceButton({ listening, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center justify-center w-16 h-16 rounded-full 
        text-white shadow-lg transition-transform duration-300
        ${listening ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-700"}
        hover:scale-105
      `}
    >
      {/* Show pulse effect while listening */}
      {listening && (
        <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
      )}

      {/* Switch between microphone and stop icons */}
      {listening ? <Square size={28} /> : <Mic size={28} />}
    </button>
  );
}
