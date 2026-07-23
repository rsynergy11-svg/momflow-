"use client";

import { useState, useTransition } from "react";
import { generateVoiceNote } from "@/app/actions/generateVoiceNote";

export default function VoiceNoteButton({ briefId }: { briefId: string }) {
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generating, startGenerate] = useTransition();

  function handleGenerate() {
    setError(null);
    startGenerate(async () => {
      const result = await generateVoiceNote(briefId);
      if (result.ok) {
        setAudioUri(result.audioDataUri);
      } else {
        setError(result.error);
      }
    });
  }

  if (audioUri) {
    return (
      <div className="card p-3.5 mb-2">
        <p className="text-xs font-semibold text-text-primary mb-2">🔊 Voice note ready</p>
        <audio controls src={audioUri} className="w-full mb-2" />
        <div className="flex gap-2">
          <a href={audioUri} download="momflow-brief.mp3" className="btn-secondary flex-1 py-2 text-xs text-center">
            Download
          </a>
          <button onClick={() => setAudioUri(null)} className="text-text-secondary text-xs font-medium px-2">
            Redo
          </button>
        </div>
        <p className="text-[10px] text-text-secondary mt-2">
          Forward this file to your cook on WhatsApp — automatic voice-note sending isn&apos;t available yet.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-2">
      <button onClick={handleGenerate} disabled={generating} className="btn-secondary w-full py-3 text-sm">
        {generating ? "Generating voice note…" : "🔊 Generate voice note"}
      </button>
      {error && <p className="text-error text-xs mt-1.5 px-1">{error}</p>}
    </div>
  );
}
