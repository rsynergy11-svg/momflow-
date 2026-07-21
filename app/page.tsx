import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center">🍲</div>
          <span className="font-semibold text-lg text-text-primary">MomFlow</span>
        </div>
        <nav className="flex items-center gap-6">
          <Link href="/pricing" className="text-text-secondary text-sm font-medium hidden sm:block">
            Pricing
          </Link>
          <Link href="/login" className="btn-primary px-5 py-2.5 text-sm">
            Sign in
          </Link>
        </nav>
      </header>

      <section className="max-w-3xl mx-auto px-6 pt-12 pb-20 text-center">
        <h1 className="text-4xl sm:text-5xl font-semibold text-text-primary leading-tight">
          Set the rules once.
          <br />
          Your cook gets it every morning.
        </h1>
        <p className="text-text-secondary text-lg mt-5 max-w-xl mx-auto">
          MomFlow is the kitchen OS for Indian households. Save your family&apos;s dietary rules,
          fasting days, and preferences — we send a clear, personal WhatsApp brief to your cook
          every morning, in their own language.
        </p>
        <div className="flex items-center justify-center gap-3 mt-8">
          <Link href="/login" className="btn-primary px-7 py-3.5 text-base">
            Start free — 14 days
          </Link>
          <Link href="/pricing" className="btn-secondary px-7 py-3.5 text-base">
            See pricing
          </Link>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mt-16 text-left">
          {[
            {
              icon: "🧠",
              title: "Remembers everything",
              body: "“Papa no rice at night.” Say it once, MomFlow never forgets.",
            },
            {
              icon: "🗣️",
              title: "Speaks their language",
              body: "Hindi, Marathi, Gujarati, Odia, Tamil, Bengali — natural, not robotic.",
            },
            {
              icon: "📲",
              title: "Straight to WhatsApp",
              body: "One tap sends today's brief directly to your cook's phone.",
            },
          ].map((f) => (
            <div key={f.title} className="card p-5">
              <div className="text-2xl mb-2">{f.icon}</div>
              <h3 className="font-semibold text-text-primary mb-1">{f.title}</h3>
              <p className="text-text-secondary text-sm">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
