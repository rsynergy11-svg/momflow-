// Text-to-speech via Google Cloud Text-to-Speech (broadest coverage of the Indian
// languages MomFlow already supports). Never throws — callers should always have the
// text version ready, since a cook missing a voice note should never block on it.

export type TtsResult = { ok: true; audioBase64: string } | { ok: false; error: string };

const LANGUAGE_CODE: Record<string, string> = {
  hindi: "hi-IN",
  marathi: "mr-IN",
  gujarati: "gu-IN",
  tamil: "ta-IN",
  bengali: "bn-IN",
  odia: "or-IN", // Google Cloud TTS coverage for Odia is limited/newer — falls back gracefully if unsupported.
  english: "en-IN",
};

export async function synthesizeSpeech(text: string, language: string): Promise<TtsResult> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "Voice notes aren't configured yet (missing GOOGLE_TTS_API_KEY)." };
  }

  const languageCode = LANGUAGE_CODE[language] || "en-IN";

  try {
    const res = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text },
          voice: { languageCode, ssmlGender: "FEMALE" },
          audioConfig: { audioEncoding: "MP3", speakingRate: 0.95 },
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        ok: false,
        error: `Voice generation failed for ${languageCode} (${res.status}). ${body}`.trim(),
      };
    }

    const json = (await res.json()) as { audioContent?: string };
    if (!json.audioContent) {
      return { ok: false, error: "No audio returned." };
    }

    return { ok: true, audioBase64: json.audioContent };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown voice generation error" };
  }
}
