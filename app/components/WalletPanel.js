// WalletPanel.js — Wallet card for Student (Alice) or Consultant (Junaid).
// Alice's panel: amount input + milestone description input + send/escrow buttons.
// Junaid's panel: reset demo button (send XRP back to Alice).
// Escrow release/dispute is handled by EscrowList, not here.

"use client";

import { useState, useEffect, useRef } from "react";
import EscrowModal from "./EscrowModal";
import QRModal from "./QRModal";

export default function WalletPanel({
  title,
  role,
  walletAddress,
  balance,
  xrpPrice,
  onEscrowCreated, // (sequence, createdAt, amount, milestone) → called after escrow is created
  onAction,        // () → called after any transaction to trigger a balance refresh
  onLog,           // (entry) → adds a line to the transaction log
  onReset,         // () → called after reset so parent can clear escrow state (consultant only)
}) {
  const [amount, setAmount]       = useState("10");
  const [milestone, setMilestone] = useState(""); // milestone description for escrow
  const [loadingState, setLoadingState] = useState(null); // 'pay' | 'escrow' | null
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError]         = useState(null);
  const [showEscrowModal, setShowEscrowModal] = useState(false);
  const [showQRModal, setShowQRModal]         = useState(false);
  const [balanceFlash, setBalanceFlash]       = useState(null); // 'up' | 'down' | null
  const prevBalanceRef = useRef(null);

  // Flash the balance green when it goes up, orange when it goes down
  useEffect(() => {
    if (balance == null || prevBalanceRef.current == null) {
      prevBalanceRef.current = balance;
      return;
    }
    const prev = parseFloat(prevBalanceRef.current);
    const curr = parseFloat(balance);
    if (curr > prev) {
      setBalanceFlash("up");
      setTimeout(() => setBalanceFlash(null), 1500);
    } else if (curr < prev) {
      setBalanceFlash("down");
      setTimeout(() => setBalanceFlash(null), 1500);
    }
    prevBalanceRef.current = balance;
  }, [balance]);

  // Fire confetti on successful transactions (visual bonus — won't break if it fails)
  async function fireConfetti() {
    try {
      const confetti = (await import("canvas-confetti")).default;
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ["#5C47FA", "#00B67A", "#F59E0B", "#8B5CF6"] });
    } catch { /* optional */ }
  }

  // ── Direct XRP payment: Alice → Junaid ────────────────────────────────────
  async function handleDirectPayment() {
    if (!validAmount) return;
    setLoadingState("pay"); setError(null);
    try {
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: "student", to: "consultant", amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment failed");
      await fireConfetti();
      onLog({ type: "payment", message: `✅ Alice sent ${amount} XRP directly to Junaid`, hash: data.hash, timestamp: new Date().toLocaleTimeString() });
      onAction();
    } catch (err) {
      setError(err.message);
      onLog({ type: "error", message: `❌ Payment failed: ${err.message}`, timestamp: new Date().toLocaleTimeString() });
    } finally { setLoadingState(null); }
  }

  // ── Create escrow with milestone description ───────────────────────────────
  async function handleCreateEscrow() {
    if (!validAmount) return;
    setLoadingState("escrow"); setError(null);
    try {
      const res = await fetch("/api/escrow/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Escrow creation failed");

      const milestoneText = milestone.trim() || "Service delivery"; // default label
      onLog({
        type: "escrow",
        message: `🔒 Alice locked ${amount} XRP in escrow #${data.sequence} — Milestone: "${milestoneText}"`,
        hash: data.hash,
        timestamp: new Date().toLocaleTimeString(),
      });
      // Pass milestone text up to the demo page so EscrowList can show it
      onEscrowCreated(data.sequence, Date.now(), amount, milestoneText);
      setMilestone(""); // clear the input after creating
      onAction();
    } catch (err) {
      setError(err.message);
      onLog({ type: "error", message: `❌ Escrow failed: ${err.message}`, timestamp: new Date().toLocaleTimeString() });
    } finally { setLoadingState(null); }
  }

  // ── Reset demo: Junaid sends 20 XRP back to Alice ─────────────────────────
  async function handleReset() {
    setResetLoading(true); setError(null);
    try {
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: "consultant", to: "student", amount: "20" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");
      onLog({ type: "payment", message: `🔄 Junaid sent 20 XRP back to Alice (demo reset)`, hash: data.hash, timestamp: new Date().toLocaleTimeString() });
      if (onReset) onReset();
      onAction();
    } catch (err) { setError(err.message); }
    finally { setResetLoading(false); }
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const isStudent    = role === "student";
  const validAmount  = parseFloat(amount) > 0 && parseFloat(amount) <= 500 && amount !== "";
  const usdValue     = balance && xrpPrice ? (parseFloat(balance) * xrpPrice).toFixed(2) : null;
  const balanceColor = balanceFlash === "up" ? "text-[#00B67A]" : balanceFlash === "down" ? "text-orange-500" : "text-[#0D0D0D]";

  return (
    <>
      <EscrowModal isOpen={showEscrowModal} onClose={() => setShowEscrowModal(false)} />
      <QRModal isOpen={showQRModal} onClose={() => setShowQRModal(false)} address={walletAddress} title={title} />

      <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-5 shadow-sm">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#0D0D0D]">{title}</h2>
            <span className="inline-block mt-1 text-xs font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full bg-[#EEF2FF] text-[#5C47FA] border border-[#C7D2FE]">
              {isStudent ? "Student · Mauritius" : "Unistellar Admissions · Abu Dhabi"}
            </span>
          </div>
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-black border-2 border-gray-200 bg-[#EEF2FF] text-[#5C47FA]">X</div>
        </div>

        {/* ── Wallet address ── */}
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Wallet Address</p>
            <button onClick={() => setShowQRModal(true)} className="text-xs text-gray-400 hover:text-[#5C47FA] flex items-center gap-1 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 3.5V16M4 4h5v5H4V4zm11 0h5v5h-5V4zM4 15h5v5H4v-5z" />
              </svg>
              QR
            </button>
          </div>
          <p className="font-mono text-sm text-gray-700 break-all">{walletAddress || "Loading…"}</p>
        </div>

        {/* ── Balance ── */}
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider font-medium">XRP Balance</p>
          <div className="flex items-end gap-3">
            <p className={`text-3xl font-bold transition-colors duration-700 ${balanceColor}`}>
              {balance ? parseFloat(balance).toFixed(2) : "—"}
              <span className="text-lg text-gray-400 ml-2 font-normal">XRP</span>
            </p>
            {balanceFlash === "up"   && <span className="text-[#00B67A] text-lg mb-1 animate-bounce">↑</span>}
            {balanceFlash === "down" && <span className="text-orange-500 text-lg mb-1 animate-bounce">↓</span>}
          </div>
          {usdValue && <p className="text-gray-400 text-sm mt-1">≈ ${usdValue} USD</p>}
        </div>

        <div className="border-t border-gray-100" />

        {/* ── Student actions ── */}
        {isStudent && (
          <>
            {/* Amount input */}
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-500 whitespace-nowrap font-medium">Amount (XRP)</label>
              <input
                type="number" min="1" max="500" step="1"
                value={amount} onChange={(e) => setAmount(e.target.value)}
                disabled={loadingState !== null}
                className="bg-white border border-gray-200 focus:border-[#5C47FA] focus:ring-2 focus:ring-[#5C47FA]/10 rounded-xl px-3 py-2 text-gray-900 text-sm w-28 outline-none transition-all"
              />
              {!validAmount && amount !== "" && <span className="text-[#EF4444] text-xs">1–500 XRP</span>}
            </div>

            {/* Milestone description (used for escrow) */}
            <div>
              <label className="text-sm text-gray-500 block mb-1.5 font-medium">
                Milestone Description <span className="text-gray-300">(for escrow)</span>
              </label>
              <input
                type="text"
                placeholder='e.g. "Personal statement submitted"'
                value={milestone} onChange={(e) => setMilestone(e.target.value)}
                disabled={loadingState !== null}
                maxLength={80}
                className="w-full bg-white border border-gray-200 focus:border-[#5C47FA] focus:ring-2 focus:ring-[#5C47FA]/10 rounded-xl px-3 py-2 text-gray-900 text-sm outline-none transition-all placeholder:text-gray-300"
              />
            </div>

            {/* Direct payment button */}
            <button
              onClick={handleDirectPayment}
              disabled={loadingState !== null || !validAmount}
              className="bg-[#5C47FA] hover:bg-[#4A38E0] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-full transition-all flex items-center justify-center gap-2"
            >
              {loadingState === "pay" ? <Spinner /> : null}
              {loadingState === "pay" ? "Sending…" : `Send ${amount || "?"} XRP Direct`}
            </button>

            {/* Escrow button + explainer */}
            <div className="flex gap-2">
              <button
                onClick={handleCreateEscrow}
                disabled={loadingState !== null || !validAmount}
                className="flex-1 bg-white hover:bg-gray-50 border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-semibold py-3 px-4 rounded-full transition-all flex items-center justify-center gap-2"
              >
                {loadingState === "escrow" ? <Spinner /> : null}
                {loadingState === "escrow" ? "Creating…" : `Lock ${amount || "?"} XRP in Escrow`}
              </button>
              <button
                onClick={() => setShowEscrowModal(true)}
                className="w-11 rounded-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-400 hover:text-gray-700 transition-all flex items-center justify-center font-bold text-lg"
                title="What is escrow?"
              >?</button>
            </div>
          </>
        )}

        {/* ── Consultant actions ── */}
        {!isStudent && (
          <>
            <p className="text-xs text-gray-400 text-center">
              Use the <strong className="text-gray-600">Active Escrows</strong> panel below to release or dispute payments.
            </p>
            <button
              onClick={handleReset}
              disabled={resetLoading}
              className="bg-white hover:bg-gray-50 border border-gray-200 disabled:opacity-50 text-gray-700 font-semibold py-3 px-4 rounded-full transition-all flex items-center justify-center gap-2"
            >
              {resetLoading ? <Spinner /> : null}
              {resetLoading ? "Resetting…" : "Reset Demo (Send 20 XRP to Alice)"}
            </button>
          </>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
            {error}
          </div>
        )}
      </div>
    </>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}
