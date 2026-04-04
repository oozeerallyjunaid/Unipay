// AnimatedMap.js — Shows an animated payment route from Mauritius to Abu Dhabi.
// Uses SVG animateMotion to draw a dot traveling along a curved path.
// No external mapping library needed — pure SVG + CSS.

"use client";

export default function AnimatedMap({ isActive = true }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-900 font-bold">Live Payment Route</h3>
        <span className="flex items-center gap-2 text-xs text-[#00B67A] font-medium">
          <span className="w-2 h-2 rounded-full bg-[#00B67A] animate-pulse" />
          XRP Ledger Active
        </span>
      </div>

      {/* City labels above the SVG */}
      <div className="flex justify-between px-4 mb-1">
        <div className="text-center">
          <p className="text-2xl">🇲🇺</p>
          <p className="text-gray-900 text-sm font-bold">Mauritius</p>
          <p className="text-gray-400 text-xs">Student · Alice</p>
        </div>
        <div className="text-center">
          <p className="text-2xl">🇦🇪</p>
          <p className="text-gray-900 text-sm font-bold">Abu Dhabi</p>
          <p className="text-gray-400 text-xs">Consultant · Junaid</p>
        </div>
      </div>

      {/* SVG animated route */}
      <div className="relative w-full">
        <svg
          viewBox="0 0 500 100"
          className="w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Dashed background track */}
          <path
            id="paymentRoute"
            d="M 40,60 C 150,10 350,10 460,60"
            stroke="rgba(92,71,250,0.15)"
            strokeWidth="2"
            strokeDasharray="8 5"
            fill="none"
          />

          {/* Active line */}
          <path
            d="M 40,60 C 150,10 350,10 460,60"
            stroke="url(#lineGrad)"
            strokeWidth="1.5"
            fill="none"
            opacity="0.7"
          />

          {/* Gradient for the line */}
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#5C47FA" />
              <stop offset="100%" stopColor="#00B67A" />
            </linearGradient>
            <radialGradient id="dotGlow">
              <stop offset="0%" stopColor="#5C47FA" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#5C47FA" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Glow halo around the moving dot */}
          <circle r="12" fill="url(#dotGlow)" opacity="0.5">
            <animateMotion dur="2.5s" repeatCount="indefinite" rotate="auto">
              <mpath href="#paymentRoute" />
            </animateMotion>
          </circle>

          {/* The moving XRP dot */}
          <circle r="6" fill="#5C47FA" stroke="#A78BFA" strokeWidth="1.5">
            <animateMotion dur="2.5s" repeatCount="indefinite" rotate="auto">
              <mpath href="#paymentRoute" />
            </animateMotion>
          </circle>

          {/* "X" XRP symbol on the dot */}
          <text fontSize="7" fill="white" textAnchor="middle" dominantBaseline="middle" fontWeight="bold">
            <animateMotion dur="2.5s" repeatCount="indefinite" rotate="auto">
              <mpath href="#paymentRoute" />
            </animateMotion>
            X
          </text>

          {/* Source dot (Mauritius) */}
          <circle cx="40" cy="60" r="6" fill="#5C47FA" />
          <circle cx="40" cy="60" r="10" fill="#5C47FA" opacity="0.2">
            <animate attributeName="r" from="6" to="14" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.3" to="0" dur="2s" repeatCount="indefinite" />
          </circle>

          {/* Destination dot (Abu Dhabi) */}
          <circle cx="460" cy="60" r="6" fill="#00B67A" />
          <circle cx="460" cy="60" r="10" fill="#00B67A" opacity="0.2">
            <animate attributeName="r" from="6" to="14" dur="2s" repeatCount="indefinite" begin="1.25s" />
            <animate attributeName="opacity" from="0.3" to="0" dur="2s" repeatCount="indefinite" begin="1.25s" />
          </circle>
        </svg>
      </div>

      {/* Stats below the map */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        {[
          { label: "Settlement", value: "3–5 sec" },
          { label: "Fee", value: "<$0.001" },
          { label: "Network", value: "XRP Ledger" },
        ].map((s) => (
          <div key={s.label} className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
            <p className="text-gray-900 font-bold text-sm">{s.value}</p>
            <p className="text-gray-400 text-xs">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
