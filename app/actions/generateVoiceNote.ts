"use server";

import { createClient } from "@/lib/supabase/server";
import { synthesizeSpeech } from "@/lib/tts";

// Generates a spoken audio version of a brief for cooks who read slowly or not at all.
// Returns the audio as a base64 data URI so the browser can play/download it directly —
// no Supabase Storage bucket needed for this MVP. Sending it automatically as a WhatsApp
// voice note isn't in scope yet: Interakt's media-message API requires an active 24-hour
// customer session window, so for now this is "generate, then forward manually."
export async function generateVoiceNote(briefId: string) {
  const supabase = createClient();

  const { data: brief } = await supabase.from("daily_briefs").select("*").eq("id", briefId).single();
  if (!brief) throw new Error("Brief not found");

  const text = brief.language_sent === "english" ? brief.brief_english : brief.brief_hindi;
  if (!text) throw new Error("Nothing to read yet — generate the brief text first.");

  const result = await synthesizeSpeech(text, brief.language_sent || "hindi");
  if (!result.ok) {
    return { ok: false as const, error: result.error };
  }

  return { ok: true as const, audioDataUri: `data:audio/mp3;base64,${result.audioBase64}` };
}
