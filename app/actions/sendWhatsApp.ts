"use server";

import { createClient } from "@/lib/supabase/server";
import { sendInteraktMessage } from "@/lib/interakt";
import { revalidatePath } from "next/cache";

const LANG_CODE: Record<string, string> = {
  hindi: "hi",
  marathi: "mr",
  gujarati: "gu",
  odia: "or",
  tamil: "ta",
  bengali: "bn",
  english: "en",
};

// Sends the brief to the cook's WhatsApp. If Interakt fails for any reason,
// this returns the brief text so the UI can offer a "copy text" fallback —
// a WhatsApp outage should never block a mother from briefing her cook.
export async function sendBriefToWhatsApp(briefId: string) {
  const supabase = createClient();

  const { data: brief } = await supabase.from("daily_briefs").select("*").eq("id", briefId).single();
  if (!brief) return { ok: false as const, error: "Brief not found", fallbackText: "" };

  const { data: staff } = await supabase.from("staff").select("*").eq("id", brief.staff_id).single();
  if (!staff?.whatsapp_number) {
    return {
      ok: false as const,
      error: "This cook doesn't have a WhatsApp number saved yet.",
      fallbackText: brief.brief_hindi || brief.brief_english || "",
    };
  }

  const text = brief.language_sent === "english" ? brief.brief_english : brief.brief_hindi;

  const result = await sendInteraktMessage({
    whatsappNumber: staff.whatsapp_number,
    briefText: text || "",
    languageCode: LANG_CODE[brief.language_sent] || "hi",
  });

  if (result.ok) {
    await supabase
      .from("daily_briefs")
      .update({ sent_to_whatsapp: true, sent_at: new Date().toISOString() })
      .eq("id", briefId);
    revalidatePath("/brief-preview");
    revalidatePath("/dashboard");
    return { ok: true as const, error: null, fallbackText: "" };
  }

  return { ok: false as const, error: result.error, fallbackText: text || "" };
}
