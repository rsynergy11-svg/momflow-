export type InteraktResult = { ok: true } | { ok: false; error: string };

// Sends a WhatsApp template message via Interakt.
// Never throws — callers should always have a copy-to-clipboard fallback ready,
// since a failed WhatsApp send should never block the core "brief is ready" flow.
export async function sendInteraktMessage(opts: {
  whatsappNumber: string;
  briefText: string;
  languageCode?: string;
}): Promise<InteraktResult> {
  const apiKey = process.env.INTERAKT_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "WhatsApp isn't configured yet (missing INTERAKT_API_KEY)." };
  }

  const digitsOnly = opts.whatsappNumber.replace(/\D/g, "");
  const phoneNumber = digitsOnly.startsWith("91") ? digitsOnly.slice(2) : digitsOnly;

  if (!phoneNumber || phoneNumber.length < 10) {
    return { ok: false, error: "That WhatsApp number doesn't look valid." };
  }

  try {
    const res = await fetch("https://api.interakt.ai/v1/public/message/", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(apiKey).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        countryCode: "91",
        phoneNumber,
        callbackData: "brief_sent",
        type: "Template",
        template: {
          name: "daily_cook_brief",
          languageCode: opts.languageCode || "hi",
          bodyValues: [opts.briefText],
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `WhatsApp send failed (${res.status}). ${body}`.trim() };
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown WhatsApp error" };
  }
}
