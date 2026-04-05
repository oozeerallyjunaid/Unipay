"use client";

// WalletConnect.js — Shows the wallet connection step between role selection and the demo interface.
// Receives all state and actions from the parent (DemoPage) — no hook usage here.

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5C47FA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="14" rx="2" />
      <path d="M16 14a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" fill="#5C47FA" stroke="none" />
      <path d="M22 10H2" />
      <path d="M6 2l4 4-4 4" />
    </svg>
  );
}

export default function WalletConnect({
  role,
  isInstalled,
  isConnecting,
  address,
  error,
  onConnect,
  onBack,
}) {
  const isCustomer = role === "customer";
  const subtitle = isCustomer
    ? "Connect your Crossmark wallet to send payments and lock funds in escrow."
    : "Connect your Crossmark wallet to receive payments and release escrows.";

  return (
    <div className="min-h-screen bg-[#F5F4FF] flex flex-col items-center justify-center px-6 py-16">
      {/* Back link */}
      <button
        onClick={onBack}
        className="text-[0.82rem] text-gray-400 hover:text-[#5C47FA] transition-colors mb-8 flex items-center gap-1 self-start max-w-[420px] w-full mx-auto"
      >
        ← Switch role
      </button>

      {/* Card */}
      <div className="w-full max-w-[420px] bg-white border border-[#E5E7EB] rounded-[20px] p-10 text-center shadow-sm">
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-[#EEF2FF] flex items-center justify-center mx-auto mb-6">
          <WalletIcon />
        </div>

        <h2 className="text-[1.3rem] font-extrabold text-[#0D0D0D] mb-3">
          Connect Your Wallet
        </h2>
        <p className="text-[0.85rem] text-[#6B7280] leading-relaxed mb-8">
          {subtitle}
        </p>

        {/* Crossmark not installed */}
        {!isInstalled && (
          <div className="bg-[#FEF3C7] border border-[#FDE68A] rounded-xl px-4 py-3.5 mb-6 text-left">
            <p className="text-[0.83rem] text-[#92400E] mb-1.5 font-medium">
              Crossmark wallet extension is required.
            </p>
            <a
              href="https://crossmark.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#5C47FA] font-semibold text-[0.83rem] hover:underline"
            >
              Install Crossmark →
            </a>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 text-[0.83rem] text-[#EF4444] text-left">
            {error}
          </div>
        )}

        {/* Connected state (brief display before auto-transition) */}
        {address ? (
          <div className="flex items-center justify-center gap-2 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl px-4 py-3">
            <span className="w-2 h-2 rounded-full bg-[#00B67A] flex-shrink-0" />
            <span className="font-mono text-[0.82rem] text-[#0D0D0D]">
              {address.slice(0, 6)}…{address.slice(-4)}
            </span>
            <span className="text-[#059669] text-[0.78rem] font-medium">Connected</span>
          </div>
        ) : (
          /* Connect button */
          <button
            onClick={onConnect}
            disabled={!isInstalled || isConnecting}
            className="w-full bg-[#5C47FA] hover:bg-[#4534E0] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-full transition-all flex items-center justify-center gap-2"
          >
            {isConnecting && <Spinner />}
            {isConnecting ? "Connecting…" : "Connect Wallet"}
          </button>
        )}

        {/* Testnet faucet note */}
        <p className="text-[0.73rem] text-gray-400 mt-5 leading-relaxed">
          Using XRP Testnet.{" "}
          <a
            href="https://faucet.tequ.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#5C47FA] hover:underline"
          >
            Get free testnet XRP →
          </a>
        </p>
      </div>
    </div>
  );
}
