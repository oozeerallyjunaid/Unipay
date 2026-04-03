// EscrowList.js — Shows all active escrows with countdown timers, Release and Dispute buttons.
// Supports multiple escrows at once so Alice can lock several payments simultaneously.

"use client";

import { useState, useEffect } from "react";

// A single escrow row with its own live countdown
function EscrowRow({ escrow, onRelease, onDispute, onLog }) {
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [actionLoading, setActionLoading] = useState(null); // 'release' | 'dispute' | null

  // Count up elapsed seconds since escrow was created
  useEffect(() => {
    const tick = () => {
      setSecondsElapsed(Math.floor((Date.now() - escrow.createdAt) / 1000));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [escrow.createdAt]);

  const canRelease = secondsElapsed >= 30; // FinishAfter passed
  const canDispute = secondsElapsed >= 90; // CancelAfter passed
  const releaseIn  = Math.max(0, 30 - secondsElapsed);
  const disputeIn  = Math.max(0, 90 - secondsElapsed);

  async function handleRelease() {
    setActionLoading("release");
    try {
      const res = await fetch("/api/escrow/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sequence: escrow.sequence }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Release failed");
      onLog({ type: "release", message: `✅ Junaid released escrow #${escrow.sequence} (${escrow.amount} XRP)`, hash: data.hash, timestamp: new Date().toLocaleTimeString() });
      onRelease(escrow.sequence);
    } catch (err) {
      onLog({ type: "error", message: `❌ Release failed: ${err.message}`, timestamp: new Date().toLocaleTimeString() });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDispute() {
    setActionLoading("dispute");
    try {
      const res = await fetch("/api/escrow/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sequence: escrow.sequence }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Dispute failed");
      onLog({ type: "dispute", message: `⚠️ Alice disputed escrow #${escrow.sequence} — ${escrow.amount} XRP refunded`, hash: data.hash, timestamp: new Date().toLocaleTimeString() });
      onDispute(escrow.sequence);
    } catch (err) {
      onLog({ type: "error", message: `❌ Dispute failed: ${err.message}`, timestamp: new Date().toLocaleTimeString() });
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 text-lg">🔒</span>
          <div>
            <span className="text-white font-bold">{escrow.amount} XRP</span>
            <span className="text-slate-500 text-xs ml-2">Seq #{escrow.sequence}</span>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
          canDispute ? "bg-red-500/20 text-red-300 border border-red-500/40" :
          canRelease ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" :
          "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40"
        }`}>
          {canDispute ? "Dispute Window Open" : canRelease ? "Ready to Release" : "Locked"}
        </span>
      </div>

      {/* Timer bars */}
      <div className="space-y-2 mb-4">
        {/* Release countdown */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 w-20">Release:</span>
          <div className="flex-1 bg-slate-700 rounded-full h-1.5">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(100, (secondsElapsed / 30) * 100)}%` }}
            />
          </div>
          <span className={canRelease ? "text-emerald-400 font-bold" : "text-slate-400"}>
            {canRelease ? "✅ Ready" : `${releaseIn}s`}
          </span>
        </div>

        {/* Dispute countdown */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 w-20">Dispute:</span>
          <div className="flex-1 bg-slate-700 rounded-full h-1.5">
            <div
              className="bg-red-500 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(100, (secondsElapsed / 90) * 100)}%` }}
            />
          </div>
          <span className={canDispute ? "text-red-400 font-bold" : "text-slate-400"}>
            {canDispute ? "⚠️ Open" : `${disputeIn}s`}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleRelease}
          disabled={!canRelease || actionLoading !== null}
          className="flex-1 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold py-2 rounded-lg transition-all flex items-center justify-center gap-1"
        >
          {actionLoading === "release" ? <Spinner /> : "🔓"}
          {actionLoading === "release" ? "Releasing..." : "Release (Junaid)"}
        </button>

        <button
          onClick={handleDispute}
          disabled={!canDispute || actionLoading !== null}
          className="flex-1 bg-red-900 hover:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold py-2 rounded-lg transition-all flex items-center justify-center gap-1"
        >
          {actionLoading === "dispute" ? <Spinner /> : "⚠️"}
          {actionLoading === "dispute" ? "Disputing..." : "Dispute (Alice)"}
        </button>
      </div>
    </div>
  );
}

export default function EscrowList({ escrows, onRelease, onDispute, onLog, onBalanceRefresh }) {
  if (escrows.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-600 text-sm">
        <p className="text-2xl mb-2">🔓</p>
        No active escrows. Alice can create one using the Lock button.
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold">Active Escrows</h3>
        <span className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-xs font-bold px-2 py-1 rounded-full">
          {escrows.length} locked
        </span>
      </div>

      <div className="space-y-3">
        {escrows.map((escrow) => (
          <EscrowRow
            key={escrow.sequence}
            escrow={escrow}
            onRelease={(seq) => { onRelease(seq); onBalanceRefresh(); }}
            onDispute={(seq) => { onDispute(seq); onBalanceRefresh(); }}
            onLog={onLog}
          />
        ))}
      </div>

      <p className="text-xs text-slate-600 text-center mt-3">
        Release window: 30–90s · Dispute window: after 90s
      </p>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}
