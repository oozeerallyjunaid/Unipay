// app/page.js — Landing page. The first thing visitors see.
// Shows the hero, key stats, feature overview, and a big "Launch Demo" button.

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950">

      {/* ====== HERO ====== */}
      <section className="relative overflow-hidden">
        {/* Gradient glow background effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-80 h-80 bg-teal-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 py-24 text-center relative">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 text-blue-300 text-sm px-4 py-2 rounded-full mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            Live on XRP Ledger Testnet · Ripple Hackathon Demo
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold text-white mb-6 leading-tight">
            Cross-Border Student
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-400 to-emerald-400">
              Payments, Reimagined
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            UniPay XRPL lets students pay international education consultants using XRP —
            settling in <strong className="text-white">3 seconds</strong> for less than{" "}
            <strong className="text-white">$0.001</strong>, with built-in escrow protection.
            No banks. No delays. No middlemen.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/demo"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg px-10 py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40"
            >
              🚀 Launch Live Demo
            </Link>
            <Link
              href="/usecases"
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-lg px-10 py-4 rounded-2xl transition-all"
            >
              View Use Cases
            </Link>
          </div>
        </div>
      </section>

      {/* ====== KEY STATS ====== */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: "3s", label: "Settlement Time", icon: "⚡" },
            { value: "<$0.001", label: "Transaction Fee", icon: "💰" },
            { value: "24/7", label: "Always Available", icon: "🌍" },
            { value: "100%", label: "Transparent", icon: "🔍" },
          ].map((stat) => (
            <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center">
              <div className="text-3xl mb-2">{stat.icon}</div>
              <p className="text-2xl font-extrabold text-white">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ====== HOW IT WORKS ====== */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-3xl font-bold text-white text-center mb-2">How It Works</h2>
        <p className="text-slate-400 text-center mb-10">Two payment modes. Both secured by the XRP Ledger.</p>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* Direct Payment */}
          <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-6">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-2xl mb-4">💸</div>
            <h3 className="text-xl font-bold text-white mb-2">Direct Payment</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Send XRP instantly from anywhere in the world to your education consultant.
              Settles in 3–5 seconds — faster than sending a WhatsApp message.
              Fees are a fraction of a cent, regardless of the amount.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-blue-400">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              XRPL Payment Transaction
            </div>
          </div>

          {/* Escrow */}
          <div className="bg-slate-900 border border-teal-500/30 rounded-2xl p-6">
            <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center text-2xl mb-4">🔒</div>
            <h3 className="text-xl font-bold text-white mb-2">Escrow Protection</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Lock funds in a smart contract on the blockchain. The consultant only
              receives payment after completing agreed milestones. If they fail to deliver,
              the student can reclaim their funds. Zero trust required.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-teal-400">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              XRPL EscrowCreate + EscrowFinish
            </div>
          </div>
        </div>
      </section>

      {/* ====== ROUTE PREVIEW ====== */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
          <p className="text-slate-500 text-xs uppercase tracking-widest mb-6">Demo Payment Route</p>
          <div className="flex items-center justify-between max-w-xl mx-auto">
            <div className="text-center">
              <div className="text-4xl mb-2">🇲🇺</div>
              <p className="text-white font-bold">Alice</p>
              <p className="text-slate-500 text-sm">Student · Mauritius</p>
            </div>
            <div className="flex-1 mx-6 flex flex-col items-center gap-2">
              <div className="w-full h-0.5 bg-gradient-to-r from-blue-500 to-teal-400 relative">
                <div className="absolute -top-1.5 left-1/2 w-3 h-3 rounded-full bg-blue-400 animate-ping" />
                <div className="absolute -top-1.5 left-1/2 w-3 h-3 rounded-full bg-blue-400" />
              </div>
              <span className="text-xs text-slate-600">XRP · 3 seconds · &lt;$0.001</span>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">🇦🇪</div>
              <p className="text-white font-bold">Junaid</p>
              <p className="text-slate-500 text-sm">Consultant · Abu Dhabi</p>
            </div>
          </div>
        </div>
      </section>

      {/* ====== FEATURES GRID ====== */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-3xl font-bold text-white text-center mb-10">Why UniPay XRPL?</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            { icon: "🛡️", title: "Escrow Protection", desc: "Funds are locked on-chain. Students are protected if a consultant doesn't deliver." },
            { icon: "⚡", title: "Instant Settlement", desc: "3-5 second finality. No waiting 3-5 business days like a SWIFT wire transfer." },
            { icon: "💱", title: "No FX Risk", desc: "Instant settlement means no exposure to currency fluctuations during transit." },
            { icon: "🌐", title: "Borderless", desc: "Works between any two countries. No bank account or credit history needed." },
            { icon: "📊", title: "Full Transparency", desc: "Every transaction is publicly verifiable on the XRP Ledger blockchain." },
            { icon: "🏛️", title: "No Middlemen", desc: "No correspondent banks, no SWIFT fees, no delays. Just student and consultant." },
          ].map((f) => (
            <div key={f.title} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="text-white font-semibold mb-1">{f.title}</h3>
              <p className="text-slate-500 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ====== FINAL CTA ====== */}
      <section className="max-w-5xl mx-auto px-6 pb-24 text-center">
        <div className="bg-gradient-to-br from-blue-900/40 to-teal-900/40 border border-blue-500/30 rounded-3xl p-12">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to see it in action?</h2>
          <p className="text-slate-400 mb-8">
            Try a real XRP payment and escrow — live on the XRP Ledger Testnet.
          </p>
          <Link
            href="/demo"
            className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg px-12 py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/30"
          >
            🚀 Launch Live Demo
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 text-center py-6 text-xs text-slate-700">
        Junaid · Unistellar Admissions Consulting · Abu Dhabi · Built on XRP Ledger
      </footer>
    </div>
  );
}
