// app/how-it-works/page.js — Step-by-step payment flow explainer.
// Shows two clearly labelled flows: Direct Payment and Escrow Payment.

import Link from "next/link";

export const metadata = {
  title: "How It Works — Payment Flows | UniPay XRPL",
  description: "Step-by-step guide to direct XRP payments and milestone-based escrow payments on the XRP Ledger.",
};

// A single numbered step in the timeline
function Step({ number, icon, title, desc, actor, isLast }) {
  const actorColor = actor === "Alice"
    ? "bg-[#EEF2FF] text-[#5C47FA] border-[#C7D2FE]"
    : actor === "Junaid"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : actor === "Both"
    ? "bg-purple-50 text-purple-700 border-purple-200"
    : "bg-gray-100 text-gray-500 border-gray-200";

  return (
    <div className="flex gap-5">
      {/* Left: number circle + vertical connector */}
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-gray-50 border-2 border-gray-200 flex items-center justify-center text-lg flex-shrink-0">
          {icon}
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-gray-100 mt-2 mb-0 min-h-[2rem]" />}
      </div>

      {/* Right: content */}
      <div className={`pb-8 ${isLast ? "" : ""}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-gray-400 text-xs font-mono">Step {number}</span>
          {actor && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${actorColor}`}>
              {actor === "Both" ? "Alice & Junaid" : actor + "'s action"}
            </span>
          )}
        </div>
        <h3 className="text-[#0D0D0D] font-bold text-base mb-1">{title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#F5F4FF]">
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-16">

        {/* Header */}
        <div className="text-center">
          <div className="inline-block bg-[#EEF2FF] border border-[#C7D2FE] text-[#5C47FA] text-sm px-4 py-2 rounded-full mb-4 font-medium">
            User Flows
          </div>
          <h1 className="text-4xl font-extrabold text-[#0D0D0D] mb-4">How It Works</h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Two ways to pay. Both fast, cheap, and verified on the XRP Ledger.
          </p>
        </div>

        {/* ── FLOW 1: Direct Payment ─────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center text-xl">💸</div>
            <div>
              <h2 className="text-2xl font-bold text-[#0D0D0D]">Flow 1 — Direct Payment</h2>
              <p className="text-gray-400 text-sm">Instant XRP transfer. Best for trusted relationships.</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <Step number={1} icon="👛" actor="Alice" title="Open UniPay XRPL"
              desc="Alice visits the demo page. Her wallet address and XRP balance load automatically — no login required. The wallet is pre-funded with Testnet XRP for this demo." />
            <Step number={2} icon="✏️" actor="Alice" title="Enter the amount"
              desc="Alice types the amount she wants to send (e.g. 10 XRP) in the amount field on her wallet panel. The approximate USD value updates in real time using the live XRP price." />
            <Step number={3} icon="💸" actor="Alice" title='Click "Send Direct Payment"'
              desc="Alice clicks the Send button. UniPay calls the /api/pay route on the server, which builds a Payment transaction, signs it with Alice's private key (stored safely on the server), and submits it to the XRP Ledger." />
            <Step number={4} icon="⚡" actor={null} title="XRP settles in 3–5 seconds"
              desc="The XRP Ledger validates the transaction in the next ledger close (every 3–5 seconds). Alice's balance decreases. No banks. No SWIFT codes. No waiting days." />
            <Step number={5} icon="📈" actor="Junaid" title="Balance increases instantly"
              desc='Junaid clicks "Refresh Balances" and sees his XRP balance has increased. Both parties can click the transaction link in the log to verify it on testnet.xrpl.org — the public blockchain explorer.' isLast />
          </div>

          {/* Key facts */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            {[
              { label: "Settlement", value: "3–5 seconds" },
              { label: "Fee paid", value: "< $0.001" },
              { label: "Reversible?", value: "No — final" },
            ].map((f) => (
              <div key={f.label} className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
                <p className="text-[#0D0D0D] font-bold">{f.value}</p>
                <p className="text-gray-400 text-xs mt-1">{f.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FLOW 2: Escrow Payment ─────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-xl">🔒</div>
            <div>
              <h2 className="text-2xl font-bold text-[#0D0D0D]">Flow 2 — Milestone Escrow Payment</h2>
              <p className="text-gray-400 text-sm">Trustless escrow. Best for new relationships or large amounts.</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <Step number={1} icon="📋" actor="Alice" title="Describe the milestone"
              desc='Alice types a milestone description — e.g. "Personal statement submitted and university shortlist delivered". This text will be stored locally and shown on the escrow card so both parties know what the payment is for.' />
            <Step number={2} icon="🔒" actor="Alice" title='Click "Lock XRP in Escrow"'
              desc="Alice clicks the escrow button. UniPay creates an EscrowCreate transaction on the XRP Ledger. The XRP is locked in a smart contract on the blockchain — Alice cannot get it back immediately, and Junaid cannot touch it yet." />
            <Step number={3} icon="⏳" actor={null} title="30-second time lock runs"
              desc="The escrow has a FinishAfter time (30 seconds for this demo — in production this could be days or weeks). A live progress bar counts down. Neither party can do anything until this expires." />
            <Step number={4} icon="✅" actor="Junaid" title='Mark milestone complete'
              desc='Once the time lock expires, Junaid completes the agreed work and clicks "Mark Milestone Complete". This is a local UI confirmation — it signals to Alice that Junaid claims the work is done.' />
            <Step number={5} icon="🔓" actor="Alice" title='Confirm and release payment'
              desc='Alice reviews that the work is done and clicks "Confirm & Release Payment". UniPay submits an EscrowFinish transaction to the blockchain, transferring the locked XRP to Junaid.' />
            <Step number={6} icon="⚠️" actor="Alice" title="Or: dispute if work wasn't done"
              desc='If Junaid never completes the work, Alice can wait for the 90-second dispute window to open and click "Dispute & Reclaim Funds". UniPay submits an EscrowCancel transaction, returning the XRP to Alice. Full protection.' isLast />
          </div>

          {/* Key facts */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            {[
              { label: "Release window", value: "After 30s" },
              { label: "Dispute window", value: "After 90s" },
              { label: "Student protected?", value: "Yes" },
            ].map((f) => (
              <div key={f.label} className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
                <p className="text-[#0D0D0D] font-bold">{f.value}</p>
                <p className="text-gray-400 text-xs mt-1">{f.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Comparison table ──────────────────────────────────────────── */}
        <section>
          <h2 className="text-2xl font-bold text-[#0D0D0D] mb-6 text-center">Which Should You Use?</h2>
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-3 bg-gray-50 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400 border-b border-gray-200">
              <span>Situation</span>
              <span className="text-[#5C47FA] text-center">Direct Payment</span>
              <span className="text-[#00B67A] text-center">Escrow</span>
            </div>
            {[
              ["You trust the consultant", "Best choice", "Works too"],
              ["First time working together", "Risky", "Best choice"],
              ["Large amount (>$500)", "Risky", "Best choice"],
              ["Small admin fee (<$50)", "Quick & easy", "Works too"],
              ["Milestone-based project", "Not ideal", "Best choice"],
              ["Need proof of payment", "On blockchain", "On blockchain"],
            ].map(([situation, direct, escrow], i) => (
              <div key={situation} className={`grid grid-cols-3 px-6 py-3.5 text-sm items-center ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                <span className="text-gray-500">{situation}</span>
                <span className="text-center text-gray-700">{direct}</span>
                <span className="text-center text-gray-700">{escrow}</span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <Link href="/demo" className="inline-block bg-[#5C47FA] hover:bg-[#4A38E0] text-white font-bold text-lg px-10 py-4 rounded-full transition-all shadow-lg shadow-[#5C47FA]/20">
            Try It Live
          </Link>
        </div>

        <footer className="text-center text-xs text-gray-400 pb-4">
          Junaid · Unistellar Admissions Consulting · Abu Dhabi · Built on XRP Ledger
        </footer>
      </div>
    </div>
  );
}
