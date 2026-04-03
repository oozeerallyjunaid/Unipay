// WalletPanel.js — Wallet card for Student (Alice) or Consultant (Junaid).
// Handles: direct payment, escrow creation, custom amounts, animated balance, QR code, confetti.
// Escrow release/dispute moved to EscrowList component.

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
  onEscrowCreated, // called with (sequence, createdAt, amount) when escrow is made
  onAction,        // called after any transaction to trigger balance refresh
  onLog,
  onReset,         // for consultant: send XRP back to Alice
}) {
  const [amount, setAmount] = useState("10");
  const [loadingState, setLoadingState] = useState(null);
  const [error, setError] = useState(null);
  const [showEscrowModal, setShowEscrowModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [balanceFlash, setBalanceFlash] = useState(null);
  const [resetLoading, setResetLoading] = useState(false);
  const prevBalanceRef = useRef(null);

  // Animate balance when it changes
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

  async function fireConfetti() {
    try {
      const confetti = (await import("canvas-confetti")).default;
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"] });
    } catch { /* optional visual */ }
  }

  // --- DIRECT PAYMENT ---
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

  // --- CREATE ESCROW ---
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
      onLog({ type: "escrow", message: `🔒 Alice locked ${amount} XRP in escrow #${data.sequence}`, hash: data.hash, timestamp: new Date().toLocaleTimeString() });
      onEscrowCreated(data.sequence, Date.now(), amount);
      onAction();
    } catch (err) {
      setError(err.message);
      onLog({ type: "error", message: `❌ Escrow failed: ${err.message}`, timestamp: new Date().toLocaleTimeString() });
    } finally { setLoadingState(null); }
  }

  // --- RESET DEMO (Consultant only) ---
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
    } catch (err) {
      setError(err.message);
    } finally { setResetLoading(false); }
  }

  const isStudent = role === "student";
  const validAmount = parseFloat(amount) > 0 && parseFloat(amount) <= 500 && amount !== "";
  const usdValue = balance && xrpPrice ? (parseFloat(balance) * xrpPrice).toFixed(2) : null;
  const balanceColorClass = balanceFlash === "up" ? "text-emerald-400" : balanceFlash === "down" ? "text-orange-400" : "text-white";
  const borderClass = isStudent ? "border-blue-500" : "border-emerald-500";
  const btnPrimary = isStudent ? "bg-blue-600 hover:bg-blue-500 disabled:opacity-50" : "bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50";
  const btnSecondary = isStudent ? "bg-slate-700 hover:bg-slate-600 border border-blue-500/30 disabled:opacity-50" : "bg-slate-700 hover:bg-slate-600 border border-emerald-500/30 disabled:opacity-50";
  const badgeClass = isStudent ? "bg-blue-500/20 text-blue-300 border border-blue-500/40" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40";

  return (
    <>
      <EscrowModal isOpen={showEscrowModal} onClose={() => setShowEscrowModal(false)} />
      <QRModal isOpen={showQRModal} onClose={() => setShowQRModal(false)} address={walletAddress} title={title} />

      <div className={`bg-slate-900 rounded-2xl border-2 ${borderClass} p-6 flex flex-col gap-5`}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <span className={`text-xs font-semibold uppercase tracking-widest px-2 py-1 rounded-full ${badgeClass}`}>
              {isStudent ? "🎓 Student · Mauritius" : "🏛️ Unistellar Admissions · Abu Dhabi"}
            </span>
          </div>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-black border-2 ${borderClass} bg-slate-800`}>
            ✕
          </div>
        </div>

        {/* Wallet Address */}
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Wallet Address</p>
            <button onClick={() => setShowQRModal(true)} className="text-xs text-slate-500 hover:text-white flex items-center gap-1 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 3.5V16M4 4h5v5H4V4zm11 0h5v5h-5V4zM4 15h5v5H4v-5z" />
              </svg>
              QR
            </button>
          </div>
          <p className="font-mono text-sm text-white break-all">{walletAddress || "Loading..."}</p>
        </div>

        {/* Balance */}
        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider">XRP Balance</p>
          <div className="flex items-end gap-3">
            <p className={`text-3xl font-bold transition-colors duration-700 ${balanceColorClass}`}>
              {balance ? parseFloat(balance).toFixed(2) : "—"}
              <span className="text-lg text-slate-400 ml-2 font-normal">XRP</span>
            </p>
            {balanceFlash === "up" && <span className="text-emerald-400 text-lg mb-1 animate-bounce">↑</span>}
            {balanceFlash === "down" && <span className="text-orange-400 text-lg mb-1 animate-bounce">↓</span>}
          </div>
          {usdValue && <p className="text-slate-500 text-sm mt-1">≈ ${usdValue} USD</p>}
        </div>

        <div className="border-t border-slate-700" />

        {/* Amount input — student only */}
        {isStudent && (
          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-400 whitespace-nowrap">Amount (XRP)</label>
            <input
              type="number" min="1" max="500" step="1"
              value={amount} onChange={(e) => setAmount(e.target.value)}
              disabled={loadingState !== null}
              className="bg-slate-800 border border-slate-600 focus:border-blue-500 rounded-lg px-3 py-2 text-white text-sm w-28 outline-none transition-colors"
            />
            {!validAmount && amount !== "" && <span className="text-red-400 text-xs">Must be 1–500</span>}
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          {isStudent ? (
            <>
              <button
                onClick={handleDirectPayment}
                disabled={loadingState !== null || !validAmount}
                className={`${btnPrimary} text-white font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed`}
              >
                {loadingState === "pay" ? <Spinner /> : "💸"}
                {loadingState === "pay" ? "Sending..." : `Send ${amount || "?"} XRP Direct`}
              </button>

              <div className="flex gap-2">
                <button
                  onClick={handleCreateEscrow}
                  disabled={loadingState !== null || !validAmount}
                  className={`${btnSecondary} flex-1 text-white font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed`}
                >
                  {loadingState === "escrow" ? <Spinner /> : "🔒"}
                  {loadingState === "escrow" ? "Creating..." : `Lock ${amount || "?"} XRP in Escrow`}
                </button>
                <button
                  onClick={() => setShowEscrowModal(true)}
                  className="w-11 rounded-xl bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-400 hover:text-white transition-all flex items-center justify-center font-bold text-lg"
                  title="What is escrow?"
                >?</button>
              </div>
            </>
          ) : (
            <>
              {/* Reset demo button — sends 20 XRP back to Alice */}
              <button
                onClick={handleReset}
                disabled={resetLoading}
                className="bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {resetLoading ? <Spinner /> : "🔄"}
                {resetLoading ? "Resetting..." : "Reset Demo (Send 20 XRP → Alice)"}
              </button>
              <p className="text-xs text-slate-600 text-center">
                Use escrow buttons in the Active Escrows panel below
              </p>
            </>
          )}
        </div>

        {error && (
          <div className="bg-red-900/40 border border-red-500/50 rounded-xl p-3 text-red-300 text-sm">
            ⚠️ {error}
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
