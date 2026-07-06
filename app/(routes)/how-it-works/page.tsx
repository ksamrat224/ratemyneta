import Link from "next/link";
import { Navbar } from "@/app/components/layout/Navbar";

const STEPS = [
  {
    num: "01",
    title: "Connect Your Wallet",
    desc: "Use any Solana-compatible wallet (Phantom, Backpack, Solflare). Your identity stays pseudonymous — only your public key is stored on-chain.",
  },
  {
    num: "02",
    title: "Choose a Politician",
    desc: "Browse the leaderboard or search by name, party, or constituency. Click a politician to view their parliamentary record and community ratings.",
  },
  {
    num: "03",
    title: "Submit Your Rating",
    desc: "Rate them on 4 categories: Integrity, Work Ethic, Promises Kept, and Overall. Each wallet can submit one rating per politician, enforced by a PDA on Solana.",
  },
  {
    num: "04",
    title: "On-Chain Forever",
    desc: "Your rating is written to the Solana blockchain and cannot be deleted or altered. Aggregate scores update automatically and are visible to everyone.",
  },
];

const SCORES = [
  { label: "Objective Score (60%)", sub: "Attendance × 0.40 + Bill Score × 0.60", color: "bg-blue-500" },
  { label: "Community Score (40%)", sub: "Janamat Approval × 0.50 + Citizen Ratings × 0.50", color: "bg-[#dc2626]" },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-14 space-y-14">
        {/* Hero */}
        <section className="space-y-3">
          <h1 className="text-4xl font-black text-gray-900">How It Works</h1>
          <p className="text-gray-500 text-base leading-relaxed">
            Rate My Politician combines public parliamentary records, Janamat community polls, and
            citizen ratings on Solana to create a transparent, tamper-proof accountability layer for
            Nepal's political landscape.
          </p>
        </section>

        {/* Steps */}
        <section className="space-y-6">
          <h2 className="text-xl font-black text-gray-900">Rating a Politician</h2>
          <div className="grid gap-4">
            {STEPS.map((s) => (
              <div key={s.num} className="flex gap-5 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className="text-3xl font-black text-[#dc2626]/20 shrink-0 w-12 leading-none">{s.num}</div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Scoring */}
        <section className="space-y-4">
          <h2 className="text-xl font-black text-gray-900">Composite Score Formula</h2>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            <div className="text-center">
              <div className="inline-block bg-gray-50 rounded-xl px-6 py-3 border border-gray-200">
                <span className="font-black text-gray-900 text-sm">Composite = Objective × 0.60 + Community × 0.40</span>
              </div>
            </div>
            <div className="grid gap-3">
              {SCORES.map((s) => (
                <div key={s.label} className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${s.color} shrink-0`} />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{s.label}</p>
                    <p className="text-xs text-gray-500">{s.sub}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-4 grid grid-cols-5 gap-2 text-center text-xs">
              {[["A", "≥ 80", "bg-green-500"], ["B", "≥ 65", "bg-blue-500"], ["C", "≥ 50", "bg-yellow-500"], ["D", "≥ 35", "bg-orange-500"], ["F", "< 35", "bg-red-600"]].map(([g, r, c]) => (
                <div key={g} className="flex flex-col items-center gap-1">
                  <div className={`h-8 w-8 rounded-full ${c} flex items-center justify-center text-white font-black text-sm`}>{g}</div>
                  <span className="text-gray-500">{r}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* On-chain */}
        <section className="bg-[#dc2626] rounded-2xl p-6 text-white space-y-3">
          <h2 className="text-xl font-black">Powered by Solana</h2>
          <p className="text-sm text-white/80 leading-relaxed">
            Every rating is stored in a Program Derived Account (PDA) on Solana — one per voter per
            politician, enforced by the program. Ratings cannot be duplicated, altered, or deleted.
            Aggregate sums are updated atomically on each submission.
          </p>
          <p className="text-xs text-white/60 font-mono">
            Program: DMmHWdzTeZwChv2uZbdqCDRECkP2WBQFttfY7xJYvVB5
          </p>
        </section>

        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#dc2626] text-white font-bold text-sm hover:bg-[#b91c1c] transition-colors"
          >
            Start Rating Politicians →
          </Link>
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white mt-8">
        <div className="max-w-300 mx-auto px-6 py-6 text-center text-xs text-gray-400">
          © 2024 Rate My Politician. Built on Solana.
        </div>
      </footer>
    </div>
  );
}
