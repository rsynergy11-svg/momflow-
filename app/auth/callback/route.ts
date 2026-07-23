import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// Handles the redirect back from Supabase after Google OAuth.
// Exchanges the auth code for a session, then routes the user:
// - a pending invite matches their email -> linked to that household -> /dashboard
// - already an active member of a household -> /dashboard
// - neither                               -> /onboarding
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Invited members have a household_members row with user_id still null (they
      // haven't signed in yet), matched only by email. That row is invisible to their
      // own session's RLS until it's linked, so this lookup+link runs as the service role.
      if (data.user.email) {
        const serviceClient = createServiceClient();
        const { data: pendingInvite } = await serviceClient
          .from("household_members")
          .select("id")
          .eq("invited_email", data.user.email)
          .is("user_id", null)
          .eq("status", "invited")
          .maybeSingle();

        if (pendingInvite) {
          await serviceClient
            .from("household_members")
            .update({ user_id: data.user.id, status: "active" })
            .eq("id", pendingInvite.id);
          return NextResponse.redirect(`${origin}${next && next !== "/login" ? next : "/dashboard"}`);
        }
      }

      const { data: membership } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", data.user.id)
        .eq("status", "active")
        .maybeSingle();

      if (membership) {
        return NextResponse.redirect(`${origin}${next && next !== "/login" ? next : "/dashboard"}`);
      }
      return NextResponse.redirect(`${origin}/onboarding`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
