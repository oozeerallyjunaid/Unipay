"use client";

// WalletConnect.js — Wallet connection step between role selection and demo interface.
// Supports Crossmark and GemWallet. Shows appropriate install links if neither found.

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
    </svg>
  );
}

export default function WalletConnect({
  role,
  walletLabel,   // 'Crossmark' | 'GemWallet' | null
  isDetecting,
  isInstalled,
  isConnecting,
  address,
  error,
  onConnect,
  onBack,
}) {
  const isCustomer = role === "customer";
  const subtitle = isCustomer
    ? "Connect your XRPL wallet to send payments and lock funds in escrow."
    : "Connect your XRPL wallet to receive payments and release escrows.";

  return (
    <div className="flex flex-col items-center px-6 py-10">
      {/* Back link */}
      <div className="w-full max-w-[420px] mb-6">
        <button
          onClick={onBack}
          className="text-[0.82rem] text-gray-400 hover:text-[#5C47FA] transition-colors flex items-center gap-1"
        >
          ← Switch role
        </button>
      </div>

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

        {/* Detecting state */}
        {isDetecting && (
          <div className="flex items-center justify-center gap-2 text-[0.85rem] text-gray-400 mb-6">
            <Spinner />
            Detecting wallet…
          </div>
        )}

        {/* No wallet found */}
        {!isDetecting && !isInstalled && (
          <div className="bg-[#FEF3C7] border border-[#FDE68A] rounded-xl px-4 py-4 mb-6 text-left space-y-3">
            <p className="text-[0.83rem] text-[#92400E] font-medium">
              No XRPL wallet extension detected.
            </p>
            <p className="text-[0.78rem] text-[#92400E]">Install one of these to continue:</p>
            <div className="flex flex-col gap-2">
              <a
                href="https://crossmark.io"
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#5C47FA] font-semibold text-[0.83rem] hover:underline"
              >
                <span className="w-5 h-5 rounded bg-[#EEF2FF] flex items-center justify-center text-xs">✕</span>
                Crossmark → crossmark.io
              </a>
              <a
                href="https://gemwallet.app"
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#5C47FA] font-semibold text-[0.83rem] hover:underline"
              >
                <span className="w-5 h-5 rounded bg-[#EEF2FF] flex items-center justify-center text-xs">💎</span>
                GemWallet → gemwallet.app
              </a>
            </div>
            <p className="text-[0.73rem] text-[#92400E]">After installing, refresh this page.</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 text-[0.83rem] text-[#EF4444] text-left">
            {error}
          </div>
        )}

        {/* Connected state (brief, before auto-transition) */}
        {address ? (
          <div className="flex items-center justify-center gap-2 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl px-4 py-3">
            <span className="w-2 h-2 rounded-full bg-[#00B67A] flex-shrink-0" />
            <span className="font-mono text-[0.82rem] text-[#0D0D0D]">
              {address.slice(0, 6)}…{address.slice(-4)}
            </span>
            <span className="text-[#059669] text-[0.78rem] font-medium">Connected ✓</span>
          </div>
        ) : (
          !isDetecting && isInstalled && (
            <button
              onClick={onConnect}
              disabled={isConnecting}
              className="w-full bg-[#5C47FA] hover:bg-[#4534E0] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-full transition-all flex items-center justify-center gap-2"
            >
              {isConnecting && <Spinner />}
              {isConnecting
                ? `Connecting to ${walletLabel}…`
                : `Connect with ${walletLabel}`}
            </button>
          )
        )}

        {/* Detected wallet badge */}
        {!isDetecting && isInstalled && !address && (
          <p className="text-[0.73rem] text-gray-400 mt-3">
            {walletLabel} detected ✓
          </p>
        )}

        {/* Testnet faucet */}
        <p className="text-[0.73rem] text-gray-400 mt-5 leading-relaxed">
          Using XRP Testnet.{" "}
          <a
            href="https://faucet.tequ.dev"
            target="_blank" rel="noopener noreferrer"
            className="text-[#5C47FA] hover:underline"
          >
            Get free testnet XRP →
          </a>
        </p>
      </div>
    </div>
  );
}
