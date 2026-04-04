// EscrowModal.js — A popup that explains how escrow works in plain English.
// Shown when the user clicks the "?" button near the Lock Escrow button.

"use client";

export default function EscrowModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    // Overlay behind the modal — clicking it closes the modal
    <div
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Modal box — stopPropagation prevents clicks inside from closing it */}
      <div
        className="bg-white border border-gray-200 rounded-2xl max-w-lg w-full p-6 relative shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl bg-[#EEF2FF] flex items-center justify-center text-2xl">
            🔒
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#0D0D0D]">How Escrow Works</h2>
            <p className="text-gray-400 text-sm">Smart contract protection on the XRP Ledger</p>
          </div>
        </div>

        {/* Step-by-step explanation */}
        <div className="space-y-4 mb-5">
          {[
            {
              step: "1",
              icon: "🎓",
              title: "Alice locks funds",
              desc: "The student sends 10 XRP to a special escrow contract on the blockchain — not directly to the consultant. The money is locked and neither party can touch it yet.",
            },
            {
              step: "2",
              icon: "⏳",
              title: "Time lock activates",
              desc: "A 30-second countdown begins. In a real scenario this could be days or weeks — time for the consultant to complete the service (e.g. submitting a university application).",
            },
            {
              step: "3",
              icon: "✅",
              title: "Consultant releases funds",
              desc: "Once the time lock expires, the consultant submits an EscrowFinish transaction. The XRP is transferred to their wallet automatically — no bank, no middleman.",
            },
            {
              step: "4",
              icon: "🛡️",
              title: "Student is protected",
              desc: "If a CancelAfter condition were added, the student could reclaim funds if the consultant never completes the work. The blockchain enforces the rules — no trust required.",
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center text-[#5C47FA] font-bold text-sm flex-shrink-0">
                {item.step}
              </div>
              <div>
                <p className="text-gray-900 font-semibold text-sm">
                  {item.icon} {item.title}
                </p>
                <p className="text-gray-500 text-sm mt-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Key benefit callout */}
        <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl p-4 text-sm text-[#5C47FA]">
          <strong>Why this matters for students:</strong> Traditional wire transfers offer zero protection — once you send money abroad, it's gone. XRP Ledger escrow creates enforceable, programmable agreements without lawyers or banks.
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 bg-[#5C47FA] hover:bg-[#4A38E0] text-white font-semibold py-3 rounded-full transition-all"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}
