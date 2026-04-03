// app/usecases/page.js — Three real student payment scenarios showing UniPay XRPL in action.

import Link from "next/link";

const cases = [
  {
    flag: "🇮🇳",
    studentName: "Priya Sharma",
    studentLocation: "Mumbai, India",
    consultantLocation: "London, UK",
    university: "University of Edinburgh",
    course: "MSc Data Science",
    consultingFee: "$500",
    xrpAmount: "~167 XRP",
    problem:
      "Priya's family bank charged $42 per international wire transfer and quoted 5–7 business days for delivery. The application deadline was in 4 days. The bank also required proof of relationship with the recipient, causing further delays.",
    solution:
      "Priya used UniPay XRPL to send the consulting fee directly to her consultant in London. The XRP arrived in 4 seconds. The escrow ensured her money was protected until her personal statement was submitted.",
    outcome: "✅ Priya's application was submitted on time. She was offered a place at Edinburgh with a £5,000 merit scholarship.",
    escrowPeriod: "7 days",
    savings: "$41.99 saved in fees",
    accentColor: "blue",
  },
  {
    flag: "🇧🇷",
    studentName: "Carlos Mendes",
    studentLocation: "São Paulo, Brazil",
    consultantLocation: "Abu Dhabi, UAE",
    university: "University of Birmingham",
    course: "MBA — Global Business",
    consultingFee: "$2,000",
    xrpAmount: "~667 XRP",
    problem:
      "Carlos needed to pay a large consulting package in three milestone payments. His bank flagged the first transfer as suspicious and froze it for 2 weeks of investigation. He almost missed his early application deadline.",
    solution:
      "Carlos split his payment into three XRP escrows — one for each milestone. Each escrow released automatically when Junaid completed the agreed deliverable (university shortlist, application submission, visa docs). No bank involved.",
    outcome: "✅ Carlos received all three offers he applied for. He chose Birmingham's Dubai campus — closer to home.",
    escrowPeriod: "30 days per milestone",
    savings: "$120+ saved across 3 transfers",
    accentColor: "emerald",
  },
  {
    flag: "🇲🇺",
    studentName: "Alice Ramdenee",
    studentLocation: "Port Louis, Mauritius",
    consultantLocation: "Abu Dhabi, UAE",
    university: "University of Exeter",
    course: "BSc Computer Science",
    consultingFee: "$300",
    xrpAmount: "~100 XRP",
    problem:
      "Alice is the live demo scenario. Mauritius has limited international banking infrastructure, and her local bank doesn't support direct transfers to the UAE. She would have needed to use a currency exchange bureau with a 4% markup.",
    solution:
      "Alice opened an XRP wallet for free, received a small amount of XRP, and paid Junaid at Unistellar Admissions Consulting directly — bypassing banks entirely. The escrow gave her confidence that her money was safe.",
    outcome: "✅ This is the live demo. Click Launch Demo to see Alice's payment happen in real time on the XRP Ledger.",
    escrowPeriod: "30 seconds (demo)",
    savings: "$12+ saved vs currency exchange",
    accentColor: "purple",
    isDemo: true,
  },
];

const colorMap = {
  blue:    { border: "border-blue-500/40",    badge: "bg-blue-500/20 text-blue-300 border-blue-500/40",    accent: "text-blue-400",    bg: "bg-blue-500/10"    },
  emerald: { border: "border-emerald-500/40", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", accent: "text-emerald-400", bg: "bg-emerald-500/10" },
  purple:  { border: "border-purple-500/40",  badge: "bg-purple-500/20 text-purple-300 border-purple-500/40",  accent: "text-purple-400",  bg: "bg-purple-500/10"  },
};

export default function UseCasesPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-12">

        {/* Header */}
        <div className="text-center">
          <div className="inline-block bg-blue-500/10 border border-blue-500/30 text-blue-300 text-sm px-4 py-2 rounded-full mb-4">
            🌍 Real Student Stories
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-4">Use Cases</h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Three students. Three countries. One solution. See how UniPay XRPL transforms
            cross-border education payments.
          </p>
        </div>

        {/* Case cards */}
        {cases.map((c, i) => {
          const col = colorMap[c.accentColor];
          return (
            <div key={c.studentName} className={`bg-slate-900 border-2 ${col.border} rounded-3xl overflow-hidden`}>

              {/* Card header */}
              <div className={`${col.bg} border-b ${col.border} px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
                <div className="flex items-center gap-4">
                  <span className="text-5xl">{c.flag}</span>
                  <div>
                    <h2 className="text-xl font-bold text-white">{c.studentName}</h2>
                    <p className="text-slate-400 text-sm">{c.studentLocation} → {c.consultantLocation}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${col.badge}`}>
                    Case #{i + 1}
                  </span>
                  {c.isDemo && (
                    <span className="text-xs font-semibold px-3 py-1 rounded-full border bg-yellow-500/20 text-yellow-300 border-yellow-500/40 animate-pulse">
                      ⚡ Live Demo
                    </span>
                  )}
                </div>
              </div>

              <div className="p-8 space-y-6">

                {/* University info */}
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="bg-slate-800 rounded-xl p-4">
                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">University</p>
                    <p className="text-white font-semibold text-sm">{c.university}</p>
                  </div>
                  <div className="bg-slate-800 rounded-xl p-4">
                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Course</p>
                    <p className="text-white font-semibold text-sm">{c.course}</p>
                  </div>
                  <div className="bg-slate-800 rounded-xl p-4">
                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Consulting Fee</p>
                    <p className="text-white font-semibold text-sm">{c.consultingFee} <span className="text-slate-500">({c.xrpAmount})</span></p>
                  </div>
                </div>

                {/* Problem */}
                <div>
                  <h3 className="text-red-400 font-bold text-sm mb-2">❌ The Problem</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{c.problem}</p>
                </div>

                {/* Solution */}
                <div>
                  <h3 className={`${col.accent} font-bold text-sm mb-2`}>✕ The UniPay XRPL Solution</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{c.solution}</p>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800 rounded-xl p-3 text-center">
                    <p className="text-slate-500 text-xs">Escrow Period</p>
                    <p className="text-white font-bold text-sm mt-1">{c.escrowPeriod}</p>
                  </div>
                  <div className="bg-slate-800 rounded-xl p-3 text-center">
                    <p className="text-slate-500 text-xs">Fee Savings</p>
                    <p className="text-emerald-400 font-bold text-sm mt-1">{c.savings}</p>
                  </div>
                </div>

                {/* Outcome */}
                <div className={`${col.bg} border ${col.border} rounded-xl p-4`}>
                  <p className={`${col.accent} text-sm font-semibold`}>{c.outcome}</p>
                </div>

                {/* Demo CTA */}
                {c.isDemo && (
                  <Link
                    href="/demo"
                    className="block w-full text-center bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all"
                  >
                    🚀 Watch Alice's Payment Live
                  </Link>
                )}
              </div>
            </div>
          );
        })}

        {/* Bottom CTA */}
        <div className="text-center">
          <Link
            href="/demo"
            className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg px-10 py-4 rounded-2xl transition-all"
          >
            🚀 Try the Live Demo
          </Link>
        </div>

        <footer className="text-center text-xs text-slate-700 pb-4">
          Junaid · Unistellar Admissions Consulting · Abu Dhabi · Built on XRP Ledger
        </footer>
      </div>
    </div>
  );
}
