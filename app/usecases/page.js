// app/usecases/page.js — Three real student payment scenarios showing UniPay XRPL in action.

import Link from "next/link";

export const metadata = {
  title: "Real Student Use Cases | UniPay XRPL",
  description: "Three real student payment scenarios showing UniPay XRPL in action.",
};

const cases = [
  {
    flag: "🇲🇺",
    studentName: "Sophie Bégué",
    studentLocation: "Port Louis, Mauritius",
    consultantLocation: "Abu Dhabi, UAE",
    university: "University of Kansas",
    course: "BSc Business Administration",
    consultingFee: "$450",
    xrpAmount: "~150 XRP",
    problem:
      "Sophie's Mauritian bank does not support direct USD wire transfers to the UAE. She was quoted a $38 flat fee plus a 2.5% currency conversion charge, totalling nearly $50 in fees — over 10% of her consulting payment. The transfer was also expected to take 5 business days, but her application deadline was in 3.",
    solution:
      "Sophie used UniPay XRPL to send her consulting fee in XRP directly to Junaid. The payment settled in under 5 seconds for less than a cent. She used escrow so that funds were only released once Junaid submitted her KU application and confirmed enrolment documents were in order.",
    outcome:
      "Sophie's application was submitted on time and she was accepted to the University of Kansas with a partial merit scholarship. Total fees paid: $0.0003.",
    escrowPeriod: "14 days",
    savings: "$49.99 saved vs bank transfer",
    accentColor: "blue",
  },
  {
    flag: "🇲🇺",
    studentName: "Kévin Ramdin",
    studentLocation: "Rose Hill, Mauritius",
    consultantLocation: "Abu Dhabi, UAE",
    university: "University of Pennsylvania",
    course: "BA Economics",
    consultingFee: "$1,200",
    xrpAmount: "~400 XRP",
    problem:
      "Kévin needed to pay a premium consulting package covering personal statement coaching, interview prep, and financial aid guidance for UPenn — one of the most competitive Ivy League schools. His bank required a manager's approval for transfers above $1,000 to overseas accounts, which took 11 days to process. He missed an early decision window because of this delay.",
    solution:
      "For his second application cycle, Kévin split his payment into two XRP escrows tied to specific milestones: (1) personal statement finalised and (2) all supplemental essays submitted. Each escrow released only when Junaid completed the deliverable, giving Kévin full protection on a large payment.",
    outcome:
      "Kévin's UPenn application was submitted during regular decision. He received an offer and secured need-based financial aid. The milestone escrow gave him peace of mind throughout the process.",
    escrowPeriod: "21 days per milestone",
    savings: "$85+ saved vs international wire",
    accentColor: "emerald",
  },
  {
    flag: "🇲🇺",
    studentName: "Alicia Jolicoeur",
    studentLocation: "Curepipe, Mauritius",
    consultantLocation: "Abu Dhabi, UAE",
    university: "Yale University",
    course: "MSc Global Affairs",
    consultingFee: "$800",
    xrpAmount: "~267 XRP",
    problem:
      "Alicia's Mauritian bank charged $52 per international wire transfer to the UAE, and her payment was flagged for AML review — a compliance check that froze the funds for 10 days. She was applying to Yale's highly competitive MSc Global Affairs programme and could not afford any delays to her application timeline.",
    solution:
      "Alicia switched to UniPay XRPL for instant, borderless payments. She created a single escrow with the milestone 'Yale application submitted and confirmed'. Junaid marked the milestone complete after submission, and Alicia confirmed the release — all within minutes of the application going in.",
    outcome:
      "This scenario mirrors our live demo flow exactly. Click below to watch a real XRP escrow payment happen in seconds on the XRP Ledger Testnet.",
    escrowPeriod: "30 seconds (demo)",
    savings: "$51.99 saved vs bank transfer",
    accentColor: "purple",
    isDemo: true,
  },
];

const colorMap = {
  blue:    {
    border: "border-[#BFDBFE]",
    headerBg: "bg-blue-50",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    accent: "text-blue-600",
    outcomeBg: "bg-blue-50 border-blue-200",
    outcomeText: "text-blue-700",
  },
  emerald: {
    border: "border-emerald-200",
    headerBg: "bg-emerald-50",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    accent: "text-emerald-600",
    outcomeBg: "bg-emerald-50 border-emerald-200",
    outcomeText: "text-emerald-700",
  },
  purple:  {
    border: "border-[#C7D2FE]",
    headerBg: "bg-[#F5F3FF]",
    badge: "bg-[#EEF2FF] text-[#5C47FA] border-[#C7D2FE]",
    accent: "text-[#5C47FA]",
    outcomeBg: "bg-[#EEF2FF] border-[#C7D2FE]",
    outcomeText: "text-[#5C47FA]",
  },
};

export default function UseCasesPage() {
  return (
    <div className="min-h-screen bg-[#F5F4FF]">
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-12">

        {/* Header */}
        <div className="text-center">
          <div className="inline-block bg-[#EEF2FF] border border-[#C7D2FE] text-[#5C47FA] text-sm px-4 py-2 rounded-full mb-4 font-medium">
            🎓 Student Success Stories
          </div>
          <h1 className="text-4xl font-extrabold text-[#0D0D0D] mb-4">Use Cases</h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Three Mauritian students. Three US universities.
            One solution for borderless education payments.
          </p>
        </div>

        {/* Case cards */}
        {cases.map((c, i) => {
          const col = colorMap[c.accentColor];
          return (
            <div key={c.studentName} className={`bg-white border-2 ${col.border} rounded-3xl overflow-hidden shadow-sm`}>

              {/* Card header */}
              <div className={`${col.headerBg} border-b ${col.border} px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
                <div className="flex items-center gap-4">
                  <span className="text-5xl">{c.flag}</span>
                  <div>
                    <h2 className="text-xl font-bold text-[#0D0D0D]">{c.studentName}</h2>
                    <p className="text-gray-500 text-sm">{c.studentLocation} → {c.consultantLocation}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${col.badge}`}>
                    Case #{i + 1}
                  </span>
                  {c.isDemo && (
                    <span className="text-xs font-semibold px-3 py-1 rounded-full border bg-amber-100 text-amber-700 border-amber-200 animate-pulse">
                      ⚡ Live Demo
                    </span>
                  )}
                </div>
              </div>

              <div className="p-8 space-y-6">

                {/* University info */}
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1 font-medium">University</p>
                    <p className="text-gray-900 font-semibold text-sm">{c.university}</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1 font-medium">Course</p>
                    <p className="text-gray-900 font-semibold text-sm">{c.course}</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1 font-medium">Consulting Fee</p>
                    <p className="text-gray-900 font-semibold text-sm">{c.consultingFee} <span className="text-gray-400">({c.xrpAmount})</span></p>
                  </div>
                </div>

                {/* Problem */}
                <div>
                  <h3 className="text-[#EF4444] font-bold text-sm mb-2">The Problem</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{c.problem}</p>
                </div>

                {/* Solution */}
                <div>
                  <h3 className={`${col.accent} font-bold text-sm mb-2`}>The UniPay XRPL Solution</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{c.solution}</p>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                    <p className="text-gray-400 text-xs">Escrow Period</p>
                    <p className="text-gray-900 font-bold text-sm mt-1">{c.escrowPeriod}</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                    <p className="text-gray-400 text-xs">Fee Savings</p>
                    <p className="text-[#00B67A] font-bold text-sm mt-1">{c.savings}</p>
                  </div>
                </div>

                {/* Outcome */}
                <div className={`${col.outcomeBg} border rounded-xl p-4`}>
                  <p className={`${col.outcomeText} text-sm font-semibold`}>{c.outcome}</p>
                </div>

                {/* Demo CTA */}
                {c.isDemo && (
                  <Link
                    href="/demo"
                    className="block w-full text-center bg-[#5C47FA] hover:bg-[#4A38E0] text-white font-bold py-3 rounded-full transition-all"
                  >
                    🚀 Watch Alicia's Payment Live
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
            className="inline-block bg-[#5C47FA] hover:bg-[#4A38E0] text-white font-bold text-lg px-10 py-4 rounded-full transition-all shadow-lg shadow-[#5C47FA]/20"
          >
            Try the Live Demo
          </Link>
        </div>

        <footer className="text-center text-xs text-gray-400 pb-4">
          Junaid · Unistellar Admissions Consulting · Abu Dhabi · Built on XRP Ledger
        </footer>
      </div>
    </div>
  );
}
