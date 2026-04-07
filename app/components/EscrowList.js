// EscrowList.js — Role-aware escrow list with 3-stage dispute system.
//
// Flow per escrow:
//   1. 'locked'         — XRP on-chain, waiting for FinishAfter (10 min)
//   2. 'milestone_done' — Consultant marked work complete; customer can confirm or dispute
//   3a. Released        — Customer confirms → EscrowFinish API → escrow removed
//   3b. 'disputed'      — Customer raises dispute → frozen, NO API yet
//   3c. Refunded        — Consultant issues refund → EscrowCancel API → escrow removed
//
// Props:
//   role            — 'customer' | 'consultant'
//   onMarkDone      — (seq) => void          consultant marks milestone done (local)
//   onRelease       — (seq) => void          removes escrow after successful release
//   onRaiseDispute  — (seq) => void          sets status='disputed' (local, no API)
//   onIssueRefund   — (seq) => void          removes escrow after successful cancel
//   onLog           — (entry) => void
//   onBalanceRefresh — () => void

"use client";

import { useState, useEffect } from "react";

const DEFAULT_RELEASE_WINDOW = 60;  // fallback: 60s (demo)
const DEFAULT_DISPUTE_WINDOW = 180; // fallback: 180s (demo)

function humanTime(seconds) {
  if (seconds <= 0) return "now";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m remaining` : `${h}h remaining`;
}

function Spinner() {
  return (
    <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

// ─── Single escrow row ────────────────────────────────────────────────────────
function EscrowRow({ escrow, role, onMarkDone, onRelease, onRaiseDispute, onIssueRefund, onLog }) {
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [actionLoading, setActionLoading]   = useState(null);
  const [actionError,   setActionError]     = useState(null);

  useEffect(() => {
    const tick = () => setSecondsElapsed(Math.floor((Date.now() - escrow.createdAt) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [escrow.createdAt]);

  const RELEASE_WINDOW = escrow.releaseWindowSecs ?? DEFAULT_RELEASE_WINDOW;
  const DISPUTE_WINDOW = escrow.disputeWindowSecs ?? DEFAULT_DISPUTE_WINDOW;

  const canRelease = secondsElapsed >= RELEASE_WINDOW;
  const canCancel  = secondsElapsed >= DISPUTE_WINDOW;
  const releaseIn  = Math.max(0, RELEASE_WINDOW - secondsElapsed);
  const cancelIn   = Math.max(0, DISPUTE_WINDOW - secondsElapsed);
  const isDisputed = escrow.status === "disputed";

  // Status badge
  const statusConfig = {
    locked:         { label: "Locked",            color: "bg-amber-50 text-amber-700 border-amber-200" },
    ready:          { label: "Awaiting Approval",  color: "bg-[#EEF2FF] text-[#5C47FA] border-[#C7D2FE]" },
    milestone_done: { label: "Milestone Complete", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    disputed:       { label: "DISPUTED",           color: "bg-red-50 text-red-700 border-red-200" },
  };
  const displayKey = isDisputed ? "disputed"
    : escrow.status === "locked" && canRelease ? "ready"
    : escrow.status;
  const { label: statusLabel, color: statusColor } = statusConfig[displayKey] || statusConfig.locked;

  // ── Customer confirms → EscrowFinish API ──
  async function handleRelease() {
    setActionLoading("release");
    setActionError(null);
    try {
      const res  = await fetch("/api/escrow/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sequence: parseInt(escrow.sequence, 10) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Release failed");
      onLog({
        type: "release",
        message: `✅ Payment confirmed — ${escrow.amount} XRP released to Junaid for: "${escrow.milestone}"`,
        hash: data.hash,
        timestamp: new Date().toLocaleTimeString(),
      });
      onRelease(escrow.sequence);
    } catch (err) {
      setActionError(err.message);
      onLog({ type: "error", message: `❌ Release failed: ${err.message}`, timestamp: new Date().toLocaleTimeString() });
    } finally {
      setActionLoading(null);
    }
  }

  // ── Customer raises dispute → local state only, NO API ──
  function handleRaiseDispute() {
    onRaiseDispute(escrow.sequence);
    onLog({
      type: "dispute",
      message: `⚠️ Dispute raised on escrow #${escrow.sequence} — payment frozen pending resolution`,
      timestamp: new Date().toLocaleTimeString(),
    });
  }

  // ── Consultant marks milestone done → local state only ──
  function handleMarkDone() {
    onMarkDone(escrow.sequence);
    onLog({
      type: "milestone",
      message: `📋 Junaid marked milestone complete for escrow #${escrow.sequence}: "${escrow.milestone}"`,
      timestamp: new Date().toLocaleTimeString(),
    });
  }

  // ── Consultant issues refund → EscrowCancel API ──
  async function handleIssueRefund() {
    setActionLoading("refund");
    setActionError(null);
    try {
      const res  = await fetch("/api/escrow/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sequence: parseInt(escrow.sequence, 10) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Refund failed");
      onLog({
        type: "dispute",
        message: `💸 Refund issued — ${escrow.amount} XRP returned to Alice for: "${escrow.milestone}"`,
        hash: data.hash,
        timestamp: new Date().toLocaleTimeString(),
      });
      onIssueRefund(escrow.sequence);
    } catch (err) {
      setActionError(err.message);
      onLog({ type: "error", message: `❌ Refund failed: ${err.message}`, timestamp: new Date().toLocaleTimeString() });
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">

      {/* ── Header ── */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] flex items-center justify-center text-sm">🔒</div>
          <div>
            <span className="text-gray-900 font-bold">{escrow.amount} XRP</span>
            <span className="text-gray-400 text-xs ml-2">Seq #{escrow.sequence}</span>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      {/* ── Milestone ── */}
      {escrow.milestone && (
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1 font-medium">Milestone</p>
          <p className="text-gray-700 text-sm">{escrow.milestone}</p>
        </div>
      )}

      {/* ── Timer bars (hidden when disputed) ── */}
      {!isDisputed && (
        <div className="px-4 pt-3 pb-1 space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400 w-28 flex-shrink-0">Release window:</span>
            <div className="flex-1 bg-gray-100 rounded-full h-1.5">
              <div
                className="bg-[#00B67A] h-1.5 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(100, (secondsElapsed / RELEASE_WINDOW) * 100)}%` }}
              />
            </div>
            <span className={`w-28 text-right font-medium ${canRelease ? "text-[#00B67A]" : "text-gray-400"}`}>
              {canRelease ? "Open" : humanTime(releaseIn)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400 w-28 flex-shrink-0">Dispute window:</span>
            <div className="flex-1 bg-gray-100 rounded-full h-1.5">
              <div
                className="bg-[#EF4444] h-1.5 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(100, (secondsElapsed / DISPUTE_WINDOW) * 100)}%` }}
              />
            </div>
            <span className={`w-28 text-right font-medium ${canCancel ? "text-[#EF4444]" : "text-gray-400"}`}>
              {canCancel ? "Expired" : humanTime(cancelIn)}
            </span>
          </div>
        </div>
      )}

      {/* ══ CUSTOMER ACTIONS ══ */}
      {role === "customer" && (
        <div className="p-4 space-y-2">
          {isDisputed ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
              <p className="text-[#EF4444] text-sm font-semibold">This payment is frozen pending resolution.</p>
              <p className="text-red-400 text-xs mt-1">Your consultant has been notified and can issue a refund.</p>
            </div>
          ) : escrow.status === "milestone_done" ? (
            <>
              <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl px-3 py-2 mb-1">
                <p className="text-xs font-bold text-[#5C47FA]">YOUR ACTION REQUIRED</p>
                <p className="text-xs text-[#4338CA] mt-0.5">
                  Junaid confirmed the milestone. Release payment if satisfied, or raise a dispute.
                </p>
              </div>
              <button
                onClick={handleRelease}
                disabled={actionLoading !== null}
                className="w-full bg-[#00B67A] hover:bg-[#009962] disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-full transition-all flex items-center justify-center gap-2"
              >
                {actionLoading === "release" && <Spinner />}
                {actionLoading === "release" ? "Releasing payment…" : "Confirm & Release Payment"}
              </button>
              <button
                onClick={handleRaiseDispute}
                disabled={actionLoading !== null}
                className="w-full bg-white hover:bg-red-50 border border-red-200 disabled:opacity-50 text-[#EF4444] text-sm font-semibold py-2.5 rounded-full transition-all"
              >
                Raise a Dispute
              </button>
              <p className="text-[0.7rem] text-gray-400 text-center">
                Raising a dispute freezes the payment. Your consultant can then issue a refund on-chain.
              </p>
            </>
          ) : canRelease ? (
            <p className="text-center text-xs text-gray-400 py-2 bg-gray-50 rounded-xl">
              Awaiting Junaid to mark this milestone complete…
            </p>
          ) : (
            <p className="text-center text-xs text-gray-300 py-2">
              Time lock active — {humanTime(releaseIn)} until release window opens
            </p>
          )}
          {actionError && (
            <div className="mt-2 bg-red-50 border border-red-200 rounded-xl p-3 text-[#EF4444] text-xs break-words">
              {actionError}
            </div>
          )}
        </div>
      )}

      {/* ══ CONSULTANT ACTIONS ══ */}
      {role === "consultant" && (
        <div className="p-4 space-y-2">
          {isDisputed ? (
            <>
              <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-2">
                <p className="text-[#EF4444] text-sm font-semibold">This escrow has been disputed by the student.</p>
                <p className="text-red-400 text-xs mt-0.5">Issue a refund to return funds to Alice via XRPL.</p>
              </div>
              <button
                onClick={handleIssueRefund}
                disabled={actionLoading !== null}
                className="w-full bg-[#FEF2F2] hover:bg-[#EF4444] border border-red-200 hover:border-[#EF4444] text-[#EF4444] hover:text-white text-sm font-semibold py-2.5 rounded-full transition-all flex items-center justify-center gap-2"
              >
                {actionLoading === "refund" && <Spinner />}
                {actionLoading === "refund" ? "Processing refund…" : "Issue Refund to Student"}
              </button>
            </>
          ) : escrow.status === "locked" && canRelease ? (
            <>
              <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl px-3 py-2 mb-1">
                <p className="text-xs font-bold text-[#5C47FA]">YOUR ACTION REQUIRED</p>
                <p className="text-xs text-[#4338CA] mt-0.5">
                  Time lock has passed. Mark this milestone complete to notify the student.
                </p>
              </div>
              <button
                onClick={handleMarkDone}
                disabled={actionLoading !== null}
                className="w-full bg-[#5C47FA] hover:bg-[#4A38E0] disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-full transition-all"
              >
                Mark Milestone Complete
              </button>
            </>
          ) : escrow.status === "milestone_done" ? (
            <div className="bg-gray-50 rounded-xl px-3 py-3 text-center">
              <p className="text-xs text-gray-500 font-medium">Awaiting student confirmation…</p>
              <p className="text-xs text-gray-400 mt-0.5">Alice will confirm or dispute the milestone.</p>
            </div>
          ) : (
            <p className="text-center text-xs text-gray-300 py-2">
              Time lock active — {humanTime(releaseIn)} until you can mark this milestone complete
            </p>
          )}
          {actionError && (
            <div className="mt-2 bg-red-50 border border-red-200 rounded-xl p-3 text-[#EF4444] text-xs break-words">
              {actionError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── EscrowList container ─────────────────────────────────────────────────────
export default function EscrowList({
  escrows,
  role,
  onMarkDone,
  onRelease,
  onRaiseDispute,
  onIssueRefund,
  onLog,
  onBalanceRefresh,
}) {
  if (escrows.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-3xl mb-2">🔓</p>
        <p className="text-gray-400 text-sm">No active escrows.</p>
        {role === "customer" && (
          <p className="text-gray-300 text-xs mt-1">Lock funds using the "Lock in Escrow" button above.</p>
        )}
      </div>
    );
  }

  const flowSteps = role === "customer"
    ? ["Lock Funds", "Junaid marks done", "You confirm", "Released"]
    : ["Lock Funds", "You mark done", "Alice confirms", "Released"];

  return (
    <div>
      {/* Flow legend */}
      <div className="flex items-center gap-1 text-xs text-gray-400 mb-4 flex-wrap">
        {flowSteps.map((step, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="bg-gray-100 px-2 py-1 rounded-full">{step}</span>
            {i < flowSteps.length - 1 && <span>→</span>}
          </span>
        ))}
      </div>

      <div className="space-y-4">
        {escrows.map((escrow) => (
          <EscrowRow
            key={escrow.sequence}
            escrow={escrow}
            role={role}
            onMarkDone={onMarkDone}
            onRelease={(seq) => { onRelease(seq); if (onBalanceRefresh) onBalanceRefresh(); }}
            onRaiseDispute={onRaiseDispute}
            onIssueRefund={(seq) => { onIssueRefund(seq); if (onBalanceRefresh) onBalanceRefresh(); }}
            onLog={onLog}
          />
        ))}
      </div>
    </div>
  );
}
