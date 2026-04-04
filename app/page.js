// app/page.js — Landing page. The first thing visitors see.
// Shows the hero, key stats, feature overview, and a big "Launch Demo" button.

import Link from "next/link";

export const metadata = {
  title: "UniPay XRPL — Cross-Border Student Payments | Home",
  description: "Cross-Border Student Payments, Reimagined using XRP Ledger.",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F5F4FF]">

      {/* ====== HERO ====== */}
      <section className="bg-[#F5F4FF]">
        <div className="max-w-5xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-[#EEF2FF] border border-[#C7D2FE] text-[#5C47FA] text-sm px-4 py-2 rounded-full mb-6 font-medium">
            <span className="w-2 h-2 rounded-full bg-[#5C47FA] animate-pulse" />
            Live on XRP Ledger Testnet · Ripple Hackathon Demo
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold text-[#0D0D0D] mb-6 leading-tight">
            Cross-Border Student
            <br />
            <span className="text-[#5C47FA]">Payments, Reimagined</span>
          </h1>

          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            UniPay XRPL lets students pay international education consultants using XRP —
            settling in <strong className="text-gray-900">3 seconds</strong> for less than{" "}
            <strong className="text-gray-900">$0.001</strong>, with built-in escrow protection.
            No banks. No delays. No middlemen.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/demo"
              className="bg-[#5C47FA] hover:bg-[#4A38E0] text-white font-bold text-lg px-10 py-4 rounded-full transition-all shadow-lg shadow-[#5C47FA]/20"
            >
              Launch Live Demo
            </Link>
            <Link
              href="/usecases"
              className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold text-lg px-10 py-4 rounded-full transition-all"
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
            <div key={stat.label} className="bg-white border border-gray-200 rounded-2xl p-5 text-center shadow-sm">
              <div className="text-3xl mb-2">{stat.icon}</div>
              <p className="text-2xl font-extrabold text-[#0D0D0D]">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ====== HOW IT WORKS ====== */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-3xl font-bold text-[#0D0D0D] text-center mb-2">How It Works</h2>
        <p className="text-gray-400 text-center mb-10">Two payment modes. Both secured by the XRP Ledger.</p>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* Direct Payment */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-[#EEF2FF] flex items-center justify-center text-2xl mb-4">💸</div>
            <h3 className="text-xl font-bold text-[#0D0D0D] mb-2">Direct Payment</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Send XRP instantly from anywhere in the world to your education consultant.
              Settles in 3–5 seconds — faster than sending a WhatsApp message.
              Fees are a fraction of a cent, regardless of the amount.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-[#5C47FA] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5C47FA]" />
              XRPL Payment Transaction
            </div>
          </div>

          {/* Escrow */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-[#EEF2FF] flex items-center justify-center text-2xl mb-4">🔒</div>
            <h3 className="text-xl font-bold text-[#0D0D0D] mb-2">Escrow Protection</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Lock funds in a smart contract on the blockchain. The consultant only
              receives payment after completing agreed milestones. If they fail to deliver,
              the student can reclaim their funds. Zero trust required.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-[#00B67A] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00B67A]" />
              XRPL EscrowCreate + EscrowFinish
            </div>
          </div>
        </div>
      </section>

      {/* ====== ROUTE PREVIEW ====== */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
          <p className="text-gray-400 text-xs uppercase tracking-widest mb-6">Demo Payment Route</p>
          <div className="flex items-center justify-between max-w-xl mx-auto">
            <div className="text-center">
              <div className="text-4xl mb-2">🇲🇺</div>
              <p className="text-gray-900 font-bold">Alice</p>
              <p className="text-gray-400 text-sm">Student · Mauritius</p>
            </div>
            <div className="flex-1 mx-6 flex flex-col items-center gap-2">
              <div className="w-full h-0.5 bg-gradient-to-r from-[#5C47FA] to-[#00B67A] relative">
                <div className="absolute -top-1.5 left-1/2 w-3 h-3 rounded-full bg-[#5C47FA] animate-ping" />
                <div className="absolute -top-1.5 left-1/2 w-3 h-3 rounded-full bg-[#5C47FA]" />
              </div>
              <span className="text-xs text-gray-400">XRP · 3 seconds · &lt;$0.001</span>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">🇦🇪</div>
              <p className="text-gray-900 font-bold">Junaid</p>
              <p className="text-gray-400 text-sm">Consultant · Abu Dhabi</p>
            </div>
          </div>
        </div>
      </section>

      {/* ====== FEATURES GRID ====== */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-3xl font-bold text-[#0D0D0D] text-center mb-10">Why UniPay XRPL?</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            { icon: "🛡️", title: "Escrow Protection", desc: "Funds are locked on-chain. Students are protected if a consultant doesn't deliver." },
            { icon: "⚡", title: "Instant Settlement", desc: "3-5 second finality. No waiting 3-5 business days like a SWIFT wire transfer." },
            { icon: "💱", title: "No FX Risk", desc: "Instant settlement means no exposure to currency fluctuations during transit." },
            { icon: "🌐", title: "Borderless", desc: "Works between any two countries. No bank account or credit history needed." },
            { icon: "📊", title: "Full Transparency", desc: "Every transaction is publicly verifiable on the XRP Ledger blockchain." },
            { icon: "🏛️", title: "No Middlemen", desc: "No correspondent banks, no SWIFT fees, no delays. Just student and consultant." },
          ].map((f) => (
            <div key={f.title} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="text-gray-900 font-semibold mb-1">{f.title}</h3>
              <p className="text-gray-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ====== FINAL CTA ====== */}
      <section className="max-w-5xl mx-auto px-6 pb-24 text-center">
        <div className="bg-[#F5F3FF] border border-[#C7D2FE] rounded-3xl p-12">
          <h2 className="text-3xl font-bold text-[#0D0D0D] mb-4">Ready to see it in action?</h2>
          <p className="text-gray-500 mb-8">
            Try a real XRP payment and escrow — live on the XRP Ledger Testnet.
          </p>
          <Link
            href="/demo"
            className="inline-block bg-[#5C47FA] hover:bg-[#4A38E0] text-white font-bold text-lg px-12 py-4 rounded-full transition-all shadow-lg shadow-[#5C47FA]/20"
          >
            Launch Live Demo
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 text-center py-6 text-xs text-gray-400">
        Junaid · Unistellar Admissions Consulting · Abu Dhabi · Built on XRP Ledger
      </footer>
    </div>
  );
}
