// EscrowList.js — Shows all active escrows with the full milestone-based approval flow.
//
// The flow for each escrow:
//   1. 'locked'         — XRP is on-chain, waiting for FinishAfter (30s)
//   2. 'ready'          — 30s elapsed; consultant can click "Mark Milestone Complete"
//   3. 'milestone_done' — Milestone marked; customer can confirm or dispute
//   4. Released/Disputed — Crossmark signs the tx; escrow removed from list
//
// Blockchain calls (EscrowFinish / EscrowCancel) are handled by the PARENT via
// the onRelease / onDispute callbacks, which use Crossmark for signing.

"use client";

import { useState, useEffect } from "react";

// ─── Single escrow row ────────────────────────────────────────────────────────
function EscrowRow({ escrow, onMarkDone, onRelease, onDispute, onLog }) {
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [actionLoading, setActionLoading]   = useState(null); // 'release' | 'dispute' | null
  const [actionError,   setActionError]     = useState(null);

  // Live timer — counts up from when the escrow was created
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

  const statusConfig = {
    locked:         { label: "Locked",            color: "bg-amber-50 text-amber-700 border-amber-200" },
    ready:          { label: "Awaiting Approval",  color: "bg-[#EEF2FF] text-[#5C47FA] border-[#C7D2FE]" },
    milestone_done: { label: "Milestone Complete", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  };
  const displayStatus = escrow.status === "locked" && canRelease ? "ready" : escrow.status;
  const { label: statusLabel, color: statusColor } = statusConfig[displayStatus] || statusConfig.locked;

  // ── Mark milestone done (local UI state only — no blockchain call) ──
  function handleMarkDone() {
    onMarkDone(escrow.sequence);
    onLog({
      type: "milestone",
      message: `📋 Milestone marked complete for escrow #${escrow.sequence}: "${escrow.milestone}"`,
      timestamp: new Date().toLocaleTimeString(),
    });
  }

  // ── Release → parent signs EscrowFinish via Crossmark ──
  async function handleRelease() {
    setActionLoading("release");
    setActionError(null);
    const result = await onRelease(escrow.sequence, escrow.owner);
    if (!result?.ok) {
      setActionError(result?.error || "Release failed. Try again.");
      setActionLoading(null);
    }
    // On success the parent removes this escrow from state, so this row unmounts.
  }

  // ── Dispute → parent signs EscrowCancel via Crossmark ──
  async function handleDispute() {
    setActionLoading("dispute");
    setActionError(null);
    const result = await onDispute(escrow.sequence, escrow.owner);
    if (!result?.ok) {
      setActionError(result?.error || "Dispute failed. Try again.");
      setActionLoading(null);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">

      {/* Header row */}
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

      {/* Milestone description */}
      {escrow.milestone && (
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1 font-medium">Milestone</p>
          <p className="text-gray-700 text-sm">{escrow.milestone}</p>
        </div>
      )}

      {/* Timer progress bars */}
      <div className="px-4 pt-3 pb-1 space-y-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400 w-24 flex-shrink-0">Release window:</span>
          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
            <div
              className="bg-[#00B67A] h-1.5 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(100, (secondsElapsed / 30) * 100)}%` }}
            />
          </div>
          <span className="text-gray-500 w-12 text-right">
            {canRelease ? "Open" : `${releaseIn}s`}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400 w-24 flex-shrink-0">Dispute window:</span>
          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
            <div
              className="bg-orange-300 h-1.5 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(100, (secondsElapsed / 90) * 100)}%` }}
            />
          </div>
          <span className="text-gray-500 w-12 text-right">
            {canDispute ? "Open" : `${disputeIn}s`}
          </span>
        </div>
      </div>

      {/* Inline error */}
      {actionError && (
        <div className="mx-4 mb-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-[0.78rem] text-[#EF4444]">
          {actionError}
        </div>
      )}

      {/* Action buttons */}
      <div className="p-4 space-y-2">

        {/* Mark Milestone (consultant only, before milestone_done) */}
        {canRelease && escrow.status !== "milestone_done" && (
          <div>
            <p className="text-xs text-gray-400 mb-2">
              <strong className="text-gray-600">Consultant action:</strong> confirm work is done
            </p>
            <button
              onClick={handleMarkDone}
              disabled={actionLoading !== null}
              className="w-full bg-[#5C47FA] hover:bg-[#4534E0] disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-full transition-all"
            >
              Mark Milestone Complete
            </button>
          </div>
        )}

        {/* Confirm & Release (after milestone done) */}
        {escrow.status === "milestone_done" && canRelease && (
          <div>
            <p className="text-xs text-gray-400 mb-2">
              <strong className="text-gray-600">Confirm release:</strong> Crossmark will sign EscrowFinish
            </p>
            <button
              onClick={handleRelease}
              disabled={actionLoading !== null}
              className="w-full bg-[#00B67A] hover:bg-[#009962] disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-full transition-all flex items-center justify-center gap-2"
            >
              {actionLoading === "release" ? <Spinner /> : null}
              {actionLoading === "release" ? "Signing with Crossmark…" : "Confirm & Release Payment"}
            </button>
          </div>
        )}

        {/* Dispute & Reclaim */}
        {canDispute && (
          <div>
            <p className="text-xs text-gray-400 mb-2">
              <strong className="text-gray-600">Dispute:</strong> Crossmark will sign EscrowCancel
            </p>
            <button
              onClick={handleDispute}
              disabled={actionLoading !== null}
              className="w-full bg-white hover:bg-red-50 border border-red-200 disabled:opacity-50 text-[#EF4444] text-sm font-semibold py-2.5 rounded-full transition-all flex items-center justify-center gap-2"
            >
              {actionLoading === "dispute" ? <Spinner /> : null}
              {actionLoading === "dispute" ? "Signing with Crossmark…" : "Dispute & Reclaim Funds"}
            </button>
          </div>
        )}

        {/* Waiting state */}
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
export default function EscrowList({ escrows, onMarkDone, onRelease, onDispute, onLog }) {
  if (escrows.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-3xl mb-3">🔓</p>
        <p className="text-gray-400 text-sm">No active escrows.</p>
        <p className="text-gray-300 text-xs mt-1">
          The customer can lock funds using the "Lock in Escrow" button.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {escrows.map((escrow) => (
        <EscrowRow
          key={escrow.sequence}
          escrow={escrow}
          onMarkDone={onMarkDone}
          onRelease={onRelease}
          onDispute={onDispute}
          onLog={onLog}
        />
      ))}
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
