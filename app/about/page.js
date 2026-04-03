// app/about/page.js — About page: Junaid's story, Unistellar Admissions Consulting profile.

import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-16">

        {/* ====== PAGE HEADER ====== */}
        <div className="text-center">
          <div className="inline-block bg-teal-500/10 border border-teal-500/30 text-teal-300 text-sm px-4 py-2 rounded-full mb-4">
            🏛️ About Us
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-4">
            The Team Behind UniPay XRPL
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Built by an education consultant who got tired of watching students lose money to banks.
          </p>
        </div>

        {/* ====== JUNAID PROFILE CARD ====== */}
        <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-8">
          <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">

            {/* Avatar */}
            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-5xl flex-shrink-0 shadow-xl shadow-emerald-900/40">
              👨‍💼
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                <h2 className="text-3xl font-extrabold text-white">Junaid Oozeerally</h2>
                <span className="inline-block bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/40 uppercase tracking-wider">
                  Founder
                </span>
              </div>
              <p className="text-emerald-400 font-semibold mb-1">Lead Education Consultant</p>
              <p className="text-slate-400 text-sm mb-4">📍 Abu Dhabi, United Arab Emirates</p>

              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mb-5">
                {["University Admissions", "UK Universities", "UAE Institutions", "Scholarship Guidance", "Visa Support"].map((tag) => (
                  <span key={tag} className="bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded-full border border-slate-700">
                    {tag}
                  </span>
                ))}
              </div>

              <p className="text-slate-400 leading-relaxed">
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
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-2xl">
              🌟
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Unistellar Admissions Consulting</h2>
              <p className="text-slate-400 text-sm">Abu Dhabi, UAE · Est. 2021</p>
            </div>
          </div>

          <p className="text-slate-400 leading-relaxed mb-8">
            Unistellar Admissions Consulting specialises in guiding ambitious students from developing
            countries into top-ranked universities worldwide. We handle everything from university
            selection and personal statement writing to visa applications and scholarship hunting.
            Our clients have been accepted into universities in the UK, USA, UAE, Canada, and Australia.
          </p>

          {/* Services */}
          <h3 className="text-white font-bold mb-4">Our Services</h3>
          <div className="grid sm:grid-cols-2 gap-3 mb-8">
            {[
              { icon: "🎓", service: "University Selection & Strategy", desc: "Shortlisting the right universities for your profile and budget" },
              { icon: "✍️", service: "Personal Statement Writing", desc: "Crafting compelling applications that get noticed" },
              { icon: "📋", service: "Application Management", desc: "End-to-end handling of all university applications" },
              { icon: "💰", service: "Scholarship Guidance", desc: "Identifying and applying for scholarships worldwide" },
              { icon: "✈️", service: "Visa Consultation", desc: "Student visa support for UK, UAE, USA, and Canada" },
              { icon: "🏠", service: "Pre-Departure Support", desc: "Accommodation, banking, and settling-in advice" },
            ].map((s) => (
              <div key={s.service} className="flex gap-3 bg-slate-800 rounded-xl p-4">
                <span className="text-xl">{s.icon}</span>
                <div>
                  <p className="text-white text-sm font-semibold">{s.service}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 border-t border-slate-800 pt-6">
            {[
              { value: "50+", label: "Students Placed" },
              { value: "15+", label: "Universities" },
              { value: "8", label: "Countries" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-extrabold text-white">{stat.value}</p>
                <p className="text-slate-500 text-xs">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ====== THE PROBLEM & SOLUTION ====== */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white text-center">The Problem We Solved</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-6">
              <h3 className="text-red-400 font-bold mb-3">❌ The Old Way (SWIFT Wire)</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>• Student sends money from Mauritius bank</li>
                <li>• Bank charges $35–$50 per transfer</li>
                <li>• Funds arrive in 3–5 business days</li>
                <li>• No protection if consultant disappears</li>
                <li>• Currency conversion eats 2–3% more</li>
                <li>• No transparency — where is my money?</li>
              </ul>
            </div>
            <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-2xl p-6">
              <h3 className="text-emerald-400 font-bold mb-3">✅ The UniPay XRPL Way</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
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

        {/* ====== CTA ====== */}
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
