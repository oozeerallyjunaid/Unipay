// app/about/page.js — About page: Junaid's story, Unistellar Admissions Consulting profile.

import Link from "next/link";

export const metadata = {
  title: "About Junaid & Unistellar Admissions | UniPay XRPL",
  description: "The team behind UniPay XRPL.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-16">

        {/* ====== PAGE HEADER ====== */}
        <div className="text-center">
          <div className="inline-block bg-[#EEF2FF] border border-[#C7D2FE] text-[#5C47FA] text-sm px-4 py-2 rounded-full mb-4 font-medium">
            About Us
          </div>
          <h1 className="text-4xl font-extrabold text-[#0D0D0D] mb-4">
            The Team Behind UniPay XRPL
          </h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Built by an education consultant who got tired of watching students lose money to banks.
          </p>
        </div>

        {/* ====== JUNAID PROFILE CARD ====== */}
        <div className="bg-white border-2 border-[#C7D2FE] rounded-3xl p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">

            {/* Avatar */}
            <div className="w-32 h-32 rounded-2xl bg-[#EEF2FF] flex items-center justify-center text-5xl flex-shrink-0 shadow-md">
              👨‍💼
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                <h2 className="text-3xl font-extrabold text-[#0D0D0D]">Junaid Oozeerally</h2>
                <span className="inline-block bg-[#EEF2FF] text-[#5C47FA] text-xs font-bold px-3 py-1 rounded-full border border-[#C7D2FE] uppercase tracking-wider">
                  Founder
                </span>
              </div>
              <p className="text-[#5C47FA] font-semibold mb-1">Lead Education Consultant</p>
              <p className="text-gray-400 text-sm mb-4">📍 Abu Dhabi, United Arab Emirates</p>

              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mb-5">
                {["University Admissions", "UK Universities", "UAE Institutions", "Scholarship Guidance", "Visa Support"].map((tag) => (
                  <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full border border-gray-200">
                    {tag}
                  </span>
                ))}
              </div>

              <p className="text-gray-500 leading-relaxed">
                With years of experience helping students from Mauritius, India, and across Africa
                access top universities in the UK and UAE, Junaid founded Unistellar Admissions
                Consulting to make world-class education accessible to everyone. After seeing dozens
                of students lose hundreds of dollars to bank transfer fees — and weeks waiting for
                payments to clear — he built UniPay XRPL to solve the problem once and for all.
              </p>
            </div>
          </div>
        </div>

        {/* ====== UNISTELLAR COMPANY CARD ====== */}
        <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-[#EEF2FF] flex items-center justify-center text-2xl">
              🌟
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#0D0D0D]">Unistellar Admissions Consulting</h2>
              <p className="text-gray-400 text-sm">Abu Dhabi, UAE · Est. 2021</p>
            </div>
          </div>

          <p className="text-gray-500 leading-relaxed mb-8">
            Unistellar Admissions Consulting specialises in guiding ambitious students from developing
            countries into top-ranked universities worldwide. We handle everything from university
            selection and personal statement writing to visa applications and scholarship hunting.
            Our clients have been accepted into universities in the UK, USA, UAE, Canada, and Australia.
          </p>

          {/* Services */}
          <h3 className="text-[#0D0D0D] font-bold mb-4">Our Services</h3>
          <div className="grid sm:grid-cols-2 gap-3 mb-8">
            {[
              { icon: "🎓", service: "University Selection & Strategy", desc: "Shortlisting the right universities for your profile and budget" },
              { icon: "✍️", service: "Personal Statement Writing", desc: "Crafting compelling applications that get noticed" },
              { icon: "📋", service: "Application Management", desc: "End-to-end handling of all university applications" },
              { icon: "💰", service: "Scholarship Guidance", desc: "Identifying and applying for scholarships worldwide" },
              { icon: "✈️", service: "Visa Consultation", desc: "Student visa support for UK, UAE, USA, and Canada" },
              { icon: "🏠", service: "Pre-Departure Support", desc: "Accommodation, banking, and settling-in advice" },
            ].map((s) => (
              <div key={s.service} className="flex gap-3 bg-gray-50 border border-gray-100 rounded-xl p-4">
                <span className="text-xl">{s.icon}</span>
                <div>
                  <p className="text-gray-900 text-sm font-semibold">{s.service}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-6">
            {[
              { value: "50+", label: "Students Placed" },
              { value: "15+", label: "Universities" },
              { value: "8", label: "Countries" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-extrabold text-[#0D0D0D]">{stat.value}</p>
                <p className="text-gray-400 text-xs">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ====== THE PROBLEM & SOLUTION ====== */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D0D0D] text-center">The Problem We Solved</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <h3 className="text-red-600 font-bold mb-3">The Old Way (SWIFT Wire)</h3>
              <ul className="space-y-2 text-gray-500 text-sm">
                <li>• Student sends money from Mauritius bank</li>
                <li>• Bank charges $35–$50 per transfer</li>
                <li>• Funds arrive in 3–5 business days</li>
                <li>• No protection if consultant disappears</li>
                <li>• Currency conversion eats 2–3% more</li>
                <li>• No transparency — where is my money?</li>
              </ul>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
              <h3 className="text-emerald-700 font-bold mb-3">The UniPay XRPL Way</h3>
              <ul className="space-y-2 text-gray-500 text-sm">
                <li>• Student sends XRP from anywhere</li>
                <li>• Fee: less than $0.001 always</li>
                <li>• Settles in 3–5 seconds, 24/7</li>
                <li>• Escrow protects the student</li>
                <li>• No currency conversion needed</li>
                <li>• Every transaction on public blockchain</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ====== ON-RAMP / OFF-RAMP EXPLAINER ====== */}
        <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-[#0D0D0D] mb-6 text-center">Getting Into and Out of Crypto</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <h3 className="text-[#5C47FA] font-bold mb-3 flex items-center gap-2">
                <span className="text-xl">📥</span> How do I get XRP?
              </h3>
              <ul className="space-y-3 text-gray-500 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-gray-300 mt-0.5">•</span>
                  <span><strong>Option 1:</strong> Buy XRP on an exchange like Coinbase, Binance, or Kraken, then withdraw to your XRPL wallet.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-300 mt-0.5">•</span>
                  <span><strong>Option 2:</strong> Use the XRPL DEX to swap stablecoins for XRP natively on the blockchain.</span>
                </li>
                <li className="flex items-start gap-2 text-[#5C47FA] bg-[#EEF2FF] p-2 rounded-lg border border-[#C7D2FE]">
                  <span className="text-[#5C47FA] mt-0.5">ℹ️</span>
                  <span><strong>For this demo:</strong> We've pre-funded the demo wallets with Testnet XRP for free! No real money is required.</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-[#00B67A] font-bold mb-3 flex items-center gap-2">
                <span className="text-xl">📤</span> How do I cash out XRP?
              </h3>
              <ul className="space-y-3 text-gray-500 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-gray-300 mt-0.5">•</span>
                  <span>Send your XRP to a trusted crypto exchange.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-300 mt-0.5">•</span>
                  <span>Sell the XRP for your local currency (USD, AED, EUR, etc.).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-300 mt-0.5">•</span>
                  <span>Withdraw directly to your local bank account. Fast and transparent.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ====== FUTURE ROADMAP (DEX) ====== */}
        <div className="bg-[#F5F3FF] border border-[#C7D2FE] rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 py-1 px-3 bg-[#5C47FA] text-white text-xs font-bold rounded-bl-xl">
            Coming Soon
          </div>
          <h2 className="text-2xl font-bold text-[#0D0D0D] mb-2 flex items-center gap-3">
            <span className="text-2xl">🚀</span> Future Roadmap: XRPL DEX Integration
          </h2>
          <p className="text-gray-600 leading-relaxed max-w-3xl">
            We are actively exploring integration with the XRPL's built-in Decentralized Exchange (DEX).
            This will allow students to pay in <strong className="text-[#5C47FA]">RLUSD</strong> (Ripple's stablecoin) or
            other tokens, while Junaid automatically receives <strong className="text-[#5C47FA]">XRP</strong>.
            All token swapping happens atomically on-chain — no third parties, no slippage worries, just instant cross-currency settlement.
          </p>
        </div>

        {/* ====== CTA ====== */}
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
