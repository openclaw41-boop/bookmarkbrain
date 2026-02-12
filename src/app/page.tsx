import Link from "next/link";

const features = [
  {
    icon: "🧠",
    title: "AI Summaries",
    desc: "Every bookmark gets a one-line summary and 3 key takeaways. Never wonder what you saved again.",
  },
  {
    icon: "🏷️",
    title: "Smart Categories",
    desc: "AI auto-tags each bookmark into categories like Tech, Business, Design. Zero manual organizing.",
  },
  {
    icon: "🔍",
    title: "Instant Search",
    desc: "Search across all your bookmarks by content, not just titles. Find anything in seconds.",
  },
  {
    icon: "📬",
    title: "Weekly Digest",
    desc: "Get a curated email of your best unread bookmarks. Coming soon.",
    badge: "Soon",
  },
];

const steps = [
  { num: "01", title: "Import", desc: "Paste URLs or upload your browser bookmarks file" },
  { num: "02", title: "AI Reads", desc: "AI visits each link and extracts what matters" },
  { num: "03", title: "Browse", desc: "Search, filter, and actually use your bookmarks" },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧠</span>
            <span className="font-semibold text-white">BookmarkBrain</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm text-gray-400 hover:text-white transition">Features</a>
            <a href="#pricing" className="text-sm text-gray-400 hover:text-white transition">Pricing</a>
            <Link
              href="/app"
              className="text-sm bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded-lg transition font-medium"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-8">
            <span className="text-blue-400 text-sm font-medium">✨ AI-powered bookmark manager</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-6">
            Your bookmarks are{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              gathering dust
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            You save links with the best intentions and never go back. BookmarkBrain reads them for you — AI summaries,
            smart categories, and instant search across everything you&apos;ve saved.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/app"
              className="bg-blue-500 hover:bg-blue-400 text-white px-8 py-3.5 rounded-xl text-lg font-semibold transition shadow-lg shadow-blue-500/25"
            >
              Try Free — No Signup
            </Link>
            <a
              href="#features"
              className="text-gray-400 hover:text-white px-6 py-3.5 rounded-xl text-lg transition border border-white/10 hover:border-white/20"
            >
              See How It Works
            </a>
          </div>
          <p className="text-sm text-gray-500 mt-4">20 bookmarks free. No credit card needed.</p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-16">Three steps. Zero effort.</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.num} className="relative">
                <span className="text-6xl font-black text-white/5">{step.num}</span>
                <h3 className="text-xl font-semibold text-white mt-2 mb-2">{step.title}</h3>
                <p className="text-gray-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-4">Everything your bookmarks need</h2>
          <p className="text-gray-400 text-center mb-16 max-w-xl mx-auto">
            Stop scrolling through hundreds of unsorted links. Let AI do the heavy lifting.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-3xl">{f.icon}</span>
                  {f.badge && (
                    <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">
                      {f.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-4">Simple pricing</h2>
          <p className="text-gray-400 text-center mb-16">Pay once, use forever. No subscriptions.</p>
          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Free */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8">
              <h3 className="text-lg font-semibold text-white mb-1">Free</h3>
              <p className="text-gray-500 text-sm mb-6">Try it out</p>
              <div className="text-4xl font-bold text-white mb-6">$0</div>
              <ul className="space-y-3 text-sm text-gray-400 mb-8">
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> 20 bookmarks</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> AI summaries</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Category tags</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Search</li>
              </ul>
              <Link
                href="/app"
                className="block text-center border border-white/10 text-white py-2.5 rounded-lg hover:border-white/20 transition text-sm font-medium"
              >
                Get Started
              </Link>
            </div>
            {/* Pro */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                Most Popular
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Pro</h3>
              <p className="text-gray-500 text-sm mb-6">Lifetime access</p>
              <div className="text-4xl font-bold text-white mb-1">$29</div>
              <p className="text-gray-500 text-sm mb-6">one-time payment</p>
              <ul className="space-y-3 text-sm text-gray-400 mb-8">
                <li className="flex items-center gap-2"><span className="text-blue-400">✓</span> Unlimited bookmarks</li>
                <li className="flex items-center gap-2"><span className="text-blue-400">✓</span> AI summaries</li>
                <li className="flex items-center gap-2"><span className="text-blue-400">✓</span> Category tags</li>
                <li className="flex items-center gap-2"><span className="text-blue-400">✓</span> Search</li>
                <li className="flex items-center gap-2"><span className="text-blue-400">✓</span> Weekly digest email</li>
                <li className="flex items-center gap-2"><span className="text-blue-400">✓</span> Priority support</li>
              </ul>
              <button className="block w-full text-center bg-blue-500 hover:bg-blue-400 text-white py-2.5 rounded-lg transition text-sm font-semibold shadow-lg shadow-blue-500/25">
                Get Pro — $29
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Stop saving links you&apos;ll never read</h2>
          <p className="text-gray-400 mb-8">
            Import your bookmarks in 30 seconds. AI does the rest.
          </p>
          <Link
            href="/app"
            className="inline-block bg-blue-500 hover:bg-blue-400 text-white px-8 py-3.5 rounded-xl text-lg font-semibold transition shadow-lg shadow-blue-500/25"
          >
            Try BookmarkBrain Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <span>🧠</span>
            <span>BookmarkBrain</span>
          </div>
          <p>© {new Date().getFullYear()} BookmarkBrain. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
