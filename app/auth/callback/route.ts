import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles the redirect back from Supabase after Google OAuth.
// Exchanges the auth code for a session, then routes the user:
// - no household yet -> /onboarding
// - household exists  -> /dashboard
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const { data: household } = await supabase
        .from("households")
        .select("id")
        .eq("owner_id", data.user.id)
        .maybeSingle();

      if (household) {
        return NextResponse.redirect(`${origin}${next && next !== "/login" ? next : "/dashboard"}`);
      }
      return NextResponse.redirect(`${origin}/onboarding`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
