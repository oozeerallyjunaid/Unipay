// EscrowList.js — Shows all active escrows with the full milestone-based approval flow.
//
// The flow for each escrow:
//   1. 'locked'         — XRP is on-chain, waiting for FinishAfter (30s)
//   2. 'ready'          — 30s elapsed; Junaid can click "Mark Milestone Complete"
//   3. 'milestone_done' — Junaid marked work complete; Alice can confirm or dispute
//   4. Released/Disputed — Alice's action calls the blockchain; escrow removed from list
//
// State transitions that touch the blockchain: release (finish) and dispute (cancel).
// "Mark Milestone Complete" is a local UI state change only — no blockchain call.

"use client";

import { useState, useEffect } from "react";

// ─── Single escrow row ────────────────────────────────────────────────────────
function EscrowRow({ escrow, onMarkDone, onRelease, onDispute, onLog }) {
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [actionLoading, setActionLoading]   = useState(null); // 'release' | 'dispute' | null

  // Live timer — counts up from the moment the escrow was created
  useEffect(() => {
    const tick = () => setSecondsElapsed(Math.floor((Date.now() - escrow.createdAt) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [escrow.createdAt]);

  const canRelease = secondsElapsed >= 30;  // FinishAfter window open
  const canDispute = secondsElapsed >= 90;  // CancelAfter window open
  const releaseIn  = Math.max(0, 30 - secondsElapsed);
  const disputeIn  = Math.max(0, 90 - secondsElapsed);

  // Status badge text + color
  const statusConfig = {
    locked:         { label: "Locked",             color: "bg-amber-50 text-amber-700 border-amber-200" },
    ready:          { label: "Awaiting Approval",   color: "bg-[#EEF2FF] text-[#5C47FA] border-[#C7D2FE]" },
    milestone_done: { label: "Milestone Complete",  color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  };
  // Use 'ready' status visually once time has passed but Junaid hasn't acted yet
  const displayStatus = escrow.status === "locked" && canRelease ? "ready" : escrow.status;
  const { label: statusLabel, color: statusColor } = statusConfig[displayStatus] || statusConfig.locked;

  // ── Junaid marks milestone complete (local state only — no blockchain) ──
  function handleMarkDone() {
    onMarkDone(escrow.sequence);
    onLog({
      type: "milestone",
      message: `📋 Junaid marked milestone complete for escrow #${escrow.sequence}: "${escrow.milestone}"`,
      timestamp: new Date().toLocaleTimeString(),
    });
  }

  // ── Alice confirms → calls EscrowFinish on the blockchain ──
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
      onLog({
        type: "release",
        message: `✅ Alice confirmed — ${escrow.amount} XRP released to Junaid for: "${escrow.milestone}"`,
        hash: data.hash,
        timestamp: new Date().toLocaleTimeString(),
      });
      onRelease(escrow.sequence);
    } catch (err) {
      onLog({ type: "error", message: `❌ Release failed: ${err.message}`, timestamp: new Date().toLocaleTimeString() });
    } finally {
      setActionLoading(null);
    }
  }

  // ── Alice disputes → calls EscrowCancel on the blockchain ──
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
      onLog({
        type: "dispute",
        message: `⚠️ Alice disputed escrow #${escrow.sequence} — ${escrow.amount} XRP refunded`,
        hash: data.hash,
        timestamp: new Date().toLocaleTimeString(),
      });
      onDispute(escrow.sequence);
    } catch (err) {
      onLog({ type: "error", message: `❌ Dispute failed: ${err.message}`, timestamp: new Date().toLocaleTimeString() });
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">

      {/* ── Header row ── */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] flex items-center justify-center text-[#5C47FA] text-sm">🔒</div>
          <div>
            <span className="text-gray-900 font-bold">{escrow.amount} XRP</span>
            <span className="text-gray-400 text-xs ml-2">Seq #{escrow.sequence}</span>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      {/* ── Milestone description ── */}
      {escrow.milestone && (
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1 font-medium">Milestone</p>
          <p className="text-gray-700 text-sm">{escrow.milestone}</p>
        </div>
      )}

      {/* ── Timer progress bars ── */}
      <div className="px-4 pt-3 pb-1 space-y-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400 w-24 flex-shrink-0">Release window:</span>
          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
            <div className="bg-[#00B67A] h-1.5 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(100, (secondsElapsed / 30) * 100)}%` }} />
          </div>
          <span className={`w-16 text-right font-medium ${canRelease ? "text-[#00B67A]" : "text-gray-400"}`}>
            {canRelease ? "Open" : `${releaseIn}s`}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400 w-24 flex-shrink-0">Dispute window:</span>
          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
            <div className="bg-[#EF4444] h-1.5 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(100, (secondsElapsed / 90) * 100)}%` }} />
          </div>
          <span className={`w-16 text-right font-medium ${canDispute ? "text-[#EF4444]" : "text-gray-400"}`}>
            {canDispute ? "Open" : `${disputeIn}s`}
          </span>
        </div>
      </div>

      {/* ── Action buttons — change based on status ── */}
      <div className="p-4 space-y-2">

        {/* STEP 1: Junaid marks milestone done (visible when time lock has passed and not yet done) */}
        {escrow.status === "locked" && canRelease && (
          <div>
            <p className="text-xs text-gray-400 mb-2">
              <strong className="text-gray-600">Junaid's action:</strong> confirm you've completed the work
            </p>
            <button
              onClick={handleMarkDone}
              disabled={actionLoading !== null}
              className="w-full bg-[#5C47FA] hover:bg-[#4A38E0] disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-full transition-all"
            >
              Mark Milestone Complete
            </button>
          </div>
        )}

        {/* STEP 2: Alice confirms release (visible once Junaid has marked done) */}
        {escrow.status === "milestone_done" && (
          <div>
            <p className="text-xs text-gray-400 mb-2">
              <strong className="text-gray-600">Alice's action:</strong> confirm Junaid completed the work
            </p>
            <button
              onClick={handleRelease}
              disabled={actionLoading !== null}
              className="w-full bg-[#00B67A] hover:bg-[#009962] disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-full transition-all flex items-center justify-center gap-2"
            >
              {actionLoading === "release" ? <Spinner /> : null}
              {actionLoading === "release" ? "Releasing payment…" : "Confirm & Release Payment"}
            </button>
          </div>
        )}

        {/* Dispute button: Alice gets a refund after 90s (available regardless of status) */}
        {canDispute && (
          <div>
            <p className="text-xs text-gray-400 mb-2">
              <strong className="text-gray-600">Alice's action:</strong> dispute if work wasn't completed
            </p>
            <button
              onClick={handleDispute}
              disabled={actionLoading !== null}
              className="w-full bg-white hover:bg-red-50 border border-red-200 disabled:opacity-50 text-[#EF4444] text-sm font-semibold py-2.5 rounded-full transition-all flex items-center justify-center gap-2"
            >
              {actionLoading === "dispute" ? <Spinner /> : null}
              {actionLoading === "dispute" ? "Processing refund…" : "Dispute & Reclaim Funds"}
            </button>
          </div>
        )}

        {/* While still locked (no actions yet) */}
        {escrow.status === "locked" && !canRelease && (
          <p className="text-center text-xs text-gray-300 py-1">
            Waiting for time lock to expire…
          </p>
        )}
      </div>
    </div>
  );
}

// ─── EscrowList container ─────────────────────────────────────────────────────
export default function EscrowList({ escrows, onMarkDone, onRelease, onDispute, onLog, onBalanceRefresh }) {
  if (escrows.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
        <p className="text-3xl mb-3">🔓</p>
        <p className="text-gray-400 text-sm">No active escrows.</p>
        <p className="text-gray-300 text-xs mt-1">Alice can lock funds using the "Lock XRP in Escrow" button above.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-gray-900 font-bold">Active Escrows</h3>
          <p className="text-gray-400 text-xs mt-0.5">Milestone-based approval flow</p>
        </div>
        <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold px-2.5 py-1 rounded-full">
          {escrows.length} locked
        </span>
      </div>

      {/* Flow legend */}
      <div className="flex items-center gap-1 text-xs text-gray-400 mb-4 flex-wrap">
        <span className="bg-gray-100 px-2 py-1 rounded-full">Lock</span>
        <span>→</span>
        <span className="bg-gray-100 px-2 py-1 rounded-full">Junaid marks done</span>
        <span>→</span>
        <span className="bg-gray-100 px-2 py-1 rounded-full">Alice confirms</span>
        <span>→</span>
        <span className="bg-gray-100 px-2 py-1 rounded-full">Funds release</span>
      </div>

      <div className="space-y-4">
        {escrows.map((escrow) => (
          <EscrowRow
            key={escrow.sequence}
            escrow={escrow}
            onMarkDone={onMarkDone}
            onRelease={(seq) => { onRelease(seq); onBalanceRefresh(); }}
            onDispute={(seq) => { onDispute(seq); onBalanceRefresh(); }}
            onLog={onLog}
          />
        ))}
      </div>
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
