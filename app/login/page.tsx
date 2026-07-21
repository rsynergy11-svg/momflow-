"use client";

import { createClient } from "@/lib/supabase/client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function LoginInner() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const error = searchParams.get("error");

  async function signInWithGoogle() {
    setLoading(true);
    const supabase = createClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-full bg-accent mx-auto mb-6 flex items-center justify-center text-2xl">
          🍲
        </div>
        <h1 className="text-2xl font-semibold text-text-primary mb-2">Welcome to MomFlow</h1>
        <p className="text-text-secondary mb-8">
          Set your family&apos;s food rules once. Your cook gets a clear brief every morning — in
          their language.
        </p>

        {error && (
          <p className="text-error text-sm mb-4">Something went wrong signing you in. Please try again.</p>
        )}

        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="btn-primary w-full py-3.5 flex items-center justify-center gap-3 disabled:opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#fff" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.09-1.8 2.73v2.27h2.91c1.7-1.57 2.69-3.87 2.69-6.64z"/>
            <path fill="#fff" d="M9 18c2.43 0 4.47-.8 5.96-2.17l-2.91-2.27c-.81.54-1.84.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.34C2.44 15.98 5.48 18 9 18z"/>
            <path fill="#fff" d="M3.96 10.71c-.18-.54-.28-1.11-.28-1.71s.1-1.17.28-1.71V4.95H.96C.35 6.17 0 7.55 0 9s.35 2.83.96 4.05l3-2.34z"/>
            <path fill="#fff" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.95l3 2.34C4.67 5.16 6.66 3.58 9 3.58z"/>
          </svg>
          {loading ? "Redirecting…" : "Continue with Google"}
        </button>

        <p className="text-xs text-text-secondary mt-6">
          14-day free trial. No credit card needed.
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
