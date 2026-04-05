// app/demo/page.js — Live interactive demo page.
// Role-selection flow: choose Customer or Consultant, then see that view.
// All XRPL logic, wallet functions, and transaction handlers are unchanged.
// Only the UI structure has changed.

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import AnimatedMap from "../components/AnimatedMap";
import EscrowList  from "../components/EscrowList";

// ── Fetch helpers (unchanged) ─────────────────────────────────────────────────
async function fetchWallets() {
  const res = await fetch("/api/wallet");
  if (!res.ok) throw new Error((await res.json()).error || "Could not load wallets");
  return res.json();
}
async function fetchBalance(address) {
  const res  = await fetch(`/api/balance?address=${address}`);
  const data = await res.json();
  return data.balance ?? "0.00";
}
async function fetchXrpPrice() {
  try {
    const res  = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd");
    const data = await res.json();
    return data?.ripple?.usd ?? null;
  } catch { return null; }
}

// ── Page top section (always rendered above role views) ───────────────────────
function PageTop({ onRefresh, refreshing }) {
  return (
    <>
      <div className="text-center pt-8 pb-4">
        <div className="inline-flex items-center gap-2 bg-[#EEF2FF] border border-[#C7D2FE] text-[#5C47FA] text-xs px-4 py-2 rounded-full mb-3 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#5C47FA] animate-pulse" />
          Live on XRP Ledger Testnet
        </div>
        <h1 className="text-3xl font-extrabold text-[#0D0D0D]">UniPay XRPL</h1>
      </div>

      {/* Refresh button */}
      <div className="flex justify-center pb-4">
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-[#E5E7EB] text-gray-500 text-xs font-medium px-4 py-2 rounded-full transition-all disabled:opacity-50 shadow-sm"
        >
          <svg className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {refreshing ? "Refreshing…" : "Refresh Balances"}
        </button>
      </div>

      {/* Animated route map */}
      <div className="max-w-5xl mx-auto px-6 pb-6">
        <AnimatedMap />
      </div>
    </>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

function AmountInput({ label, value, onChange, disabled }) {
  return (
    <div>
      <label className="block text-[0.82rem] font-medium text-[#4B5563] mb-1">{label}</label>
      <input
        type="number" min="1" max="500" step="1"
        value={value} onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full bg-[#F5F4FF] border-[1.5px] border-[#E5E7EB] focus:border-[#5C47FA] focus:bg-white rounded-xl px-4 py-3 text-[1rem] font-semibold text-[#0D0D0D] outline-none transition-all"
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DemoPage() {

  // ── Wallet state (unchanged) ───────────────────────────────────────────────
  const [studentAddress,    setStudentAddress]    = useState(null);
  const [consultantAddress, setConsultantAddress] = useState(null);
  const [studentBalance,    setStudentBalance]    = useState(null);
  const [consultantBalance, setConsultantBalance] = useState(null);
  const [xrpPrice,          setXrpPrice]          = useState(null);
  const [loading,           setLoading]           = useState(true);
  const [setupError,        setSetupError]        = useState(null);
  const [refreshing,        setRefreshing]        = useState(false);

  // ── Escrow state (unchanged) ───────────────────────────────────────────────
  const [escrows, setEscrows] = useState([]);

  // ── Transaction log (unchanged) ───────────────────────────────────────────
  const [logs, setLogs] = useState([]);

  // ── Role selection (replaces tab state) ───────────────────────────────────
  const [role, setRole] = useState(null); // null | 'customer' | 'consultant'

  // ── Customer payment form state ────────────────────────────────────────────
  const [amount,       setAmount]       = useState("10");
  const [milestone,    setMilestone]    = useState("");
  const [loadingState, setLoadingState] = useState(null); // 'pay' | 'escrow' | null
  const [payError,     setPayError]     = useState(null);

  // ── Consultant refund state ────────────────────────────────────────────────
  const [refundAmount,  setRefundAmount]  = useState("10");
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundError,   setRefundError]   = useState(null);

  // ── Reset state ────────────────────────────────────────────────────────────
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError,   setResetError]   = useState(null);

  // ── Balance flash ──────────────────────────────────────────────────────────
  const [studentFlash,    setStudentFlash]    = useState(null);
  const [consultantFlash, setConsultantFlash] = useState(null);
  const prevSBal = useRef(null);
  const prevCBal = useRef(null);

  // ── Persist transaction log ────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem("unipay-txlog");
      if (saved) setLogs(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem("unipay-txlog", JSON.stringify(logs)); }
    catch { /* ignore */ }
  }, [logs]);

  // Clear errors on role change
  useEffect(() => { setPayError(null); setRefundError(null); setResetError(null); }, [role]);

  // ── Balance flash effects ──────────────────────────────────────────────────
  useEffect(() => {
    if (studentBalance == null || prevSBal.current == null) { prevSBal.current = studentBalance; return; }
    const prev = parseFloat(prevSBal.current), curr = parseFloat(studentBalance);
    if (curr > prev)      { setStudentFlash("up");   setTimeout(() => setStudentFlash(null), 1500); }
    else if (curr < prev) { setStudentFlash("down"); setTimeout(() => setStudentFlash(null), 1500); }
    prevSBal.current = studentBalance;
  }, [studentBalance]);

  useEffect(() => {
    if (consultantBalance == null || prevCBal.current == null) { prevCBal.current = consultantBalance; return; }
    const prev = parseFloat(prevCBal.current), curr = parseFloat(consultantBalance);
    if (curr > prev)      { setConsultantFlash("up");   setTimeout(() => setConsultantFlash(null), 1500); }
    else if (curr < prev) { setConsultantFlash("down"); setTimeout(() => setConsultantFlash(null), 1500); }
    prevCBal.current = consultantBalance;
  }, [consultantBalance]);

  // ── Initial load (unchanged) ───────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        const [wallets, price] = await Promise.all([fetchWallets(), fetchXrpPrice()]);
        setStudentAddress(wallets.studentAddress);
        setConsultantAddress(wallets.consultantAddress);
        setXrpPrice(price);
        const [sBal, cBal] = await Promise.all([
          fetchBalance(wallets.studentAddress),
          fetchBalance(wallets.consultantAddress),
        ]);
        setStudentBalance(sBal);
        setConsultantBalance(cBal);
      } catch (err) { setSetupError(err.message); }
      finally { setLoading(false); }
    }
    init();
  }, []);

  // ── Refresh balances (unchanged) ───────────────────────────────────────────
  const refreshBalances = useCallback(async () => {
    if (!studentAddress || !consultantAddress) return;
    const [sBal, cBal] = await Promise.all([
      fetchBalance(studentAddress),
      fetchBalance(consultantAddress),
    ]);
    setStudentBalance(sBal);
    setConsultantBalance(cBal);
  }, [studentAddress, consultantAddress]);

  async function handleManualRefresh() {
    setRefreshing(true);
    await refreshBalances();
    setRefreshing(false);
  }

  function addLog(entry) { setLogs((prev) => [entry, ...prev].slice(0, 30)); }

  // ── Escrow state machine (unchanged) ──────────────────────────────────────
  function handleEscrowCreated(sequence, createdAt, amt, ms) {
    setEscrows((prev) => [{ sequence, createdAt, amount: amt, milestone: ms, status: "locked" }, ...prev]);
  }
  function handleMarkDone(sequence) {
    setEscrows((prev) => prev.map((e) => e.sequence === sequence ? { ...e, status: "milestone_done" } : e));
  }
  function handleEscrowRemoved(sequence) {
    setEscrows((prev) => prev.filter((e) => e.sequence !== sequence));
  }
  function clearEscrows() { setEscrows([]); }

  // ── Confetti (unchanged) ───────────────────────────────────────────────────
  async function fireConfetti() {
    try {
      const confetti = (await import("canvas-confetti")).default;
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ["#5C47FA", "#00B67A", "#F59E0B", "#8B5CF6"] });
    } catch { /* optional */ }
  }

  // ── XRPL transaction handlers (logic unchanged) ────────────────────────────

  const validAmount       = parseFloat(amount) > 0       && parseFloat(amount)       <= 500 && amount       !== "";
  const validRefundAmount = parseFloat(refundAmount) > 0 && parseFloat(refundAmount) <= 500 && refundAmount !== "";

  async function handleDirectPayment() {
    if (!validAmount) return;
    setLoadingState("pay"); setPayError(null);
    try {
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: "student", to: "consultant", amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment failed");
      await fireConfetti();
      addLog({ type: "payment", message: `✅ Alice sent ${amount} XRP directly to Junaid`, hash: data.hash, timestamp: new Date().toLocaleTimeString() });
      await refreshBalances();
    } catch (err) {
      setPayError(err.message);
      addLog({ type: "error", message: `❌ Payment failed: ${err.message}`, timestamp: new Date().toLocaleTimeString() });
    } finally { setLoadingState(null); }
  }

  async function handleCreateEscrow() {
    if (!validAmount) return;
    setLoadingState("escrow"); setPayError(null);
    try {
      const res = await fetch("/api/escrow/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Escrow creation failed");
      const milestoneText = milestone.trim() || "Service delivery";
      addLog({
        type: "escrow",
        message: `🔒 Alice locked ${amount} XRP in escrow #${data.sequence} — Milestone: "${milestoneText}"`,
        hash: data.hash,
        timestamp: new Date().toLocaleTimeString(),
      });
      handleEscrowCreated(data.sequence, Date.now(), amount, milestoneText);
      setMilestone("");
      await refreshBalances();
    } catch (err) {
      setPayError(err.message);
      addLog({ type: "error", message: `❌ Escrow failed: ${err.message}`, timestamp: new Date().toLocaleTimeString() });
    } finally { setLoadingState(null); }
  }

  async function handleRefund() {
    if (!validRefundAmount) return;
    setRefundLoading(true); setRefundError(null);
    try {
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: "consultant", to: "student", amount: refundAmount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Refund failed");
      await fireConfetti();
      addLog({ type: "payment", message: `💸 Junaid sent ${refundAmount} XRP refund to Alice`, hash: data.hash, timestamp: new Date().toLocaleTimeString() });
      await refreshBalances();
    } catch (err) { setRefundError(err.message); }
    finally { setRefundLoading(false); }
  }

  async function handleDemoReset() {
    setResetLoading(true); setResetError(null);
    try {
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: "consultant", to: "student", amount: "20" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");
      addLog({ type: "payment", message: `🔄 Junaid sent 20 XRP back to Alice (demo reset)`, hash: data.hash, timestamp: new Date().toLocaleTimeString() });
      clearEscrows();
      await refreshBalances();
    } catch (err) { setResetError(err.message); }
    finally { setResetLoading(false); }
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const studentUsd    = studentBalance    && xrpPrice ? (parseFloat(studentBalance)    * xrpPrice).toFixed(2) : null;
  const consultantUsd = consultantBalance && xrpPrice ? (parseFloat(consultantBalance) * xrpPrice).toFixed(2) : null;
  const sBColor = studentFlash    === "up" ? "text-[#00B67A]" : studentFlash    === "down" ? "text-orange-500" : "text-[#0D0D0D]";
  const cBColor = consultantFlash === "up" ? "text-[#00B67A]" : consultantFlash === "down" ? "text-orange-500" : "text-[#0D0D0D]";

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F4FF] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#5C47FA] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Connecting to XRP Ledger Testnet…</p>
        </div>
      </div>
    );
  }

  // ── Setup error state ──────────────────────────────────────────────────────
  if (setupError) {
    return (
      <div className="min-h-screen bg-[#F5F4FF] flex items-center justify-center px-6">
        <div className="max-w-lg w-full bg-white border border-red-200 rounded-3xl p-8 text-center space-y-4 shadow-sm">
          <div className="text-5xl">⚠️</div>
          <h2 className="text-2xl font-bold text-[#0D0D0D]">Setup Required</h2>
          <p className="text-gray-500 text-sm">{setupError}</p>
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-left text-sm text-gray-600 space-y-2">
            <p>1. Run <code className="text-[#5C47FA]">npm run dev</code></p>
            <p>2. Visit <a href="/api/setup" className="text-[#5C47FA] underline">/api/setup</a> to generate wallets</p>
            <p>3. Add seeds to <code className="text-[#5C47FA]">.env.local</code> and restart</p>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ROLE SELECTION SCREEN
  // ══════════════════════════════════════════════════════════════════════════════
  if (role === null) {
    return (
      <div className="min-h-screen bg-[#F5F4FF]">
        <div className="max-w-5xl mx-auto px-6">
          <PageTop onRefresh={handleManualRefresh} refreshing={refreshing} />

          {/* Heading */}
          <div className="text-center pt-6 pb-10">
            <h2 className="text-[2rem] font-extrabold text-[#0D0D0D] leading-tight">
              Who are you today?
            </h2>
            <p className="text-[0.95rem] text-gray-400 mt-2">Select your role to get started</p>
          </div>

          {/* Role cards */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pb-20">

            {/* Customer card */}
            <button
              onClick={() => setRole("customer")}
              className="group w-full sm:w-[280px] bg-white border-2 border-[#E5E7EB] rounded-[24px] p-10 text-center cursor-pointer transition-all duration-200 hover:border-[#5C47FA] hover:shadow-[0_8px_32px_rgba(92,71,250,0.12)] hover:-translate-y-0.5"
            >
              <div className="w-16 h-16 rounded-full bg-[#EEF2FF] flex items-center justify-center mx-auto mb-6">
                <span className="text-[1.8rem]">👤</span>
              </div>
              <h3 className="text-[1.25rem] font-extrabold text-[#0D0D0D] mb-2">I'm a Customer</h3>
              <p className="text-[0.85rem] text-[#6B7280] leading-relaxed mb-6">
                Send payments to your consultant. Pay directly or lock funds in escrow until your milestones are met.
              </p>
              <span className="block w-full bg-[#5C47FA] text-white text-[0.88rem] font-semibold py-2.5 px-6 rounded-full">
                Enter as Customer
              </span>
            </button>

            {/* Consultant card */}
            <button
              onClick={() => setRole("consultant")}
              className="group w-full sm:w-[280px] bg-white border-2 border-[#E5E7EB] rounded-[24px] p-10 text-center cursor-pointer transition-all duration-200 hover:border-[#5C47FA] hover:shadow-[0_8px_32px_rgba(92,71,250,0.12)] hover:-translate-y-0.5"
            >
              <div className="w-16 h-16 rounded-full bg-[#F0FDF4] flex items-center justify-center mx-auto mb-6">
                <span className="text-[1.8rem]">💼</span>
              </div>
              <h3 className="text-[1.25rem] font-extrabold text-[#0D0D0D] mb-2">I'm a Consultant</h3>
              <p className="text-[0.85rem] text-[#6B7280] leading-relaxed mb-6">
                Manage incoming payments. Release escrows, issue refunds, and track your balance in real time.
              </p>
              <span className="block w-full bg-[#0D0D0D] text-white text-[0.88rem] font-semibold py-2.5 px-6 rounded-full">
                Enter as Consultant
              </span>
            </button>
          </div>
        </div>

        <TransactionLog logs={logs} setLogs={setLogs} />
        <Footer />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // CUSTOMER INTERFACE
  // ══════════════════════════════════════════════════════════════════════════════
  if (role === "customer") {
    return (
      <div className="min-h-screen bg-[#F5F4FF]">
        <div className="max-w-5xl mx-auto px-6">
          <PageTop onRefresh={handleManualRefresh} refreshing={refreshing} />

          {/* Back link + header */}
          <div className="max-w-[480px] mx-auto mb-6">
            <button
              onClick={() => setRole(null)}
              className="text-[0.82rem] text-gray-400 hover:text-[#5C47FA] transition-colors mb-4 flex items-center gap-1"
            >
              ← Switch role
            </button>
            <div className="text-center">
              <h2 className="text-[1.4rem] font-extrabold text-[#0D0D0D]">Customer Portal</h2>
              <span className="inline-block mt-2 bg-[#EEF2FF] text-[#5C47FA] rounded-full text-[0.78rem] font-semibold px-3.5 py-1 border border-[#C7D2FE]">
                Alice · Student · Mauritius 🇲🇺
              </span>
            </div>
          </div>

          {/* Wallet Summary Card */}
          <div className="max-w-[480px] mx-auto mb-6">
            <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-[0.68rem] font-semibold text-gray-400 uppercase tracking-wider mb-1">Wallet Address</p>
                  <p className="font-mono text-[0.78rem] text-[#0D0D0D] break-all">{studentAddress || "Loading…"}</p>
                </div>
                <button
                  onClick={handleManualRefresh}
                  disabled={refreshing}
                  className="flex-shrink-0 bg-[#F7F8FA] hover:bg-[#E5E7EB] border border-[#E5E7EB] text-[#6B7280] rounded-full px-3 py-1 text-[0.75rem] font-medium transition-all disabled:opacity-50"
                >
                  {refreshing ? "…" : "Refresh"}
                </button>
              </div>
              <div>
                <p className="text-[0.68rem] font-semibold text-gray-400 uppercase tracking-wider mb-1">XRP Balance</p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-[2rem] font-extrabold transition-colors duration-700 ${sBColor}`}>
                    {studentBalance ? parseFloat(studentBalance).toFixed(2) : "—"}
                  </span>
                  <span className="text-[0.9rem] text-gray-400 font-medium">XRP</span>
                  {studentFlash === "up"   && <span className="text-[#00B67A] animate-bounce">↑</span>}
                  {studentFlash === "down" && <span className="text-orange-500 animate-bounce">↓</span>}
                </div>
                {studentUsd && <p className="text-[0.82rem] text-gray-400 mt-0.5">≈ ${studentUsd} USD</p>}
              </div>
            </div>
          </div>

          {/* Section A: Direct Payment */}
          <div className="max-w-[480px] mx-auto mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-[1rem] text-[#0D0D0D]">Direct Payment</span>
              <span className="bg-[#F0FDF4] text-[#059669] rounded-full text-[0.72rem] font-semibold px-2.5 py-0.5">
                Instant · 3 sec
              </span>
            </div>
            <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-6">
              <div className="mb-4">
                <p className="text-[0.75rem] text-gray-400 mb-0.5">Sending to:</p>
                <p className="font-semibold text-[#0D0D0D] text-[0.88rem]">
                  Junaid — Unistellar Admissions, Abu Dhabi 🇦🇪
                </p>
              </div>
              <AmountInput
                label="Amount (XRP)"
                value={amount}
                onChange={setAmount}
                disabled={loadingState !== null}
              />
              {!validAmount && amount !== "" && (
                <p className="text-[#EF4444] text-xs mt-1">Enter a value between 1 and 500</p>
              )}
              <button
                onClick={handleDirectPayment}
                disabled={loadingState !== null || !validAmount}
                className="w-full mt-4 bg-[#5C47FA] hover:bg-[#4534E0] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-full transition-all flex items-center justify-center gap-2"
              >
                {loadingState === "pay" && <Spinner />}
                {loadingState === "pay" ? "Sending…" : "Send Payment"}
              </button>
              {payError && loadingState === null && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3 text-[#EF4444] text-sm">{payError}</div>
              )}
            </div>
          </div>

          {/* Section B: Escrow Payment */}
          <div className="max-w-[480px] mx-auto mb-12">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-[1rem] text-[#0D0D0D]">Escrow Payment</span>
              <span className="bg-[#EEF2FF] text-[#5C47FA] rounded-full text-[0.72rem] font-semibold px-2.5 py-0.5">
                Protected
              </span>
            </div>

            {/* Info banner */}
            <div className="bg-[#F5F4FF] border border-[#C7D2FE] rounded-xl p-3.5 mb-4">
              <p className="text-[0.8rem] text-[#4338CA]">
                Funds are locked on-chain and only release when your consultant completes the agreed milestone.
              </p>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-6">
              <AmountInput
                label="Amount (XRP)"
                value={amount}
                onChange={setAmount}
                disabled={loadingState !== null}
              />
              <div className="mt-3">
                <label className="block text-[0.82rem] font-medium text-[#4B5563] mb-1">
                  Milestone Description
                </label>
                <textarea
                  placeholder='e.g. "Personal statement submitted"'
                  value={milestone} onChange={(e) => setMilestone(e.target.value)}
                  disabled={loadingState !== null}
                  maxLength={120}
                  rows={3}
                  className="w-full bg-[#F5F4FF] border-[1.5px] border-[#E5E7EB] focus:border-[#5C47FA] focus:bg-white rounded-xl px-4 py-3 text-[0.88rem] text-[#0D0D0D] outline-none transition-all resize-none placeholder:text-gray-300"
                />
              </div>
              {!validAmount && amount !== "" && (
                <p className="text-[#EF4444] text-xs mt-1">Enter a value between 1 and 500</p>
              )}
              <button
                onClick={handleCreateEscrow}
                disabled={loadingState !== null || !validAmount}
                className="w-full mt-4 bg-[#0D0D0D] hover:bg-[#1f1f1f] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-full transition-all flex items-center justify-center gap-2"
              >
                {loadingState === "escrow" && <Spinner />}
                {loadingState === "escrow" ? "Creating Escrow…" : "Lock in Escrow"}
              </button>
              <p className="text-[0.75rem] text-gray-400 text-center mt-2">
                Both parties must confirm release. Auto-returns if conditions aren't met.
              </p>
              {payError && loadingState === null && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3 text-[#EF4444] text-sm">{payError}</div>
              )}
            </div>
          </div>
        </div>

        <TransactionLog logs={logs} setLogs={setLogs} />
        <Footer />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // CONSULTANT INTERFACE
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#F5F4FF]">
      <div className="max-w-5xl mx-auto px-6">
        <PageTop />

        {/* Back link + header */}
        <div className="max-w-[560px] mx-auto mb-6">
          <button
            onClick={() => setRole(null)}
            className="text-[0.82rem] text-gray-400 hover:text-[#5C47FA] transition-colors mb-4 flex items-center gap-1"
          >
            ← Switch role
          </button>
          <div className="text-center">
            <h2 className="text-[1.4rem] font-extrabold text-[#0D0D0D]">Consultant Dashboard</h2>
            <span className="inline-block mt-2 bg-[#F0FDF4] text-[#059669] rounded-full text-[0.78rem] font-semibold px-3.5 py-1 border border-[#BBF7D0]">
              Junaid · Unistellar Admissions · Abu Dhabi 🇦🇪
            </span>
          </div>
        </div>

        {/* Balance Card */}
        <div className="max-w-[560px] mx-auto mb-6">
          <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-7">
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-[1rem] text-[#0D0D0D]">My Balance</span>
              <button
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="flex items-center gap-1.5 bg-[#F7F8FA] hover:bg-[#E5E7EB] border border-[#E5E7EB] text-[#4B5563] rounded-full px-3.5 py-1.5 text-[0.78rem] font-medium transition-all disabled:opacity-50"
              >
                <svg className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {refreshing ? "Refreshing…" : "Refresh"}
              </button>
            </div>

            <div className="flex items-baseline gap-2 mt-4">
              <span className={`text-[2.8rem] font-extrabold leading-none transition-colors duration-700 ${cBColor}`}>
                {consultantBalance ? parseFloat(consultantBalance).toFixed(2) : "—"}
              </span>
              <span className="text-[1rem] text-gray-400 font-medium">XRP</span>
              {consultantFlash === "up"   && <span className="text-[#00B67A] text-xl animate-bounce">↑</span>}
              {consultantFlash === "down" && <span className="text-orange-500 text-xl animate-bounce">↓</span>}
            </div>
            {consultantUsd && <p className="text-[0.88rem] text-gray-400 mt-1">≈ ${consultantUsd} USD</p>}

            <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
              <p className="text-[0.68rem] font-semibold text-gray-400 uppercase tracking-wider mb-1">Wallet Address</p>
              <p className="font-mono text-[0.82rem] text-[#0D0D0D] break-all">{consultantAddress || "Loading…"}</p>
            </div>
          </div>
        </div>

        {/* Active Escrows Card */}
        <div className="max-w-[560px] mx-auto mb-6">
          <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-7">
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-[1rem] text-[#0D0D0D]">Active Escrows</span>
              <span className="bg-[#EEF2FF] text-[#5C47FA] rounded-full text-[0.75rem] font-semibold px-2.5 py-0.5">
                {escrows.length} locked
              </span>
            </div>
            <EscrowList
              escrows={escrows}
              onMarkDone={handleMarkDone}
              onRelease={(seq) => { handleEscrowRemoved(seq); refreshBalances(); }}
              onDispute={(seq)  => { handleEscrowRemoved(seq); refreshBalances(); }}
              onLog={addLog}
              onBalanceRefresh={refreshBalances}
            />
          </div>
        </div>

        {/* Refund Section */}
        <div className="max-w-[560px] mx-auto mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-[1rem] text-[#0D0D0D]">Send a Refund</span>
            <span className="bg-[#FEF3C7] text-[#92400E] rounded-full text-[0.72rem] font-semibold px-2.5 py-0.5">
              Optional
            </span>
          </div>
          <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-6">
            <p className="text-[0.82rem] text-[#6B7280] mb-4">
              If a milestone wasn't completed or a refund is owed, send XRP directly back to the student.
            </p>
            <div className="mb-3">
              <p className="text-[0.75rem] text-gray-400 mb-0.5">Refunding to:</p>
              <p className="font-semibold text-[#0D0D0D] text-[0.88rem]">Alice · Student · Mauritius 🇲🇺</p>
            </div>
            <AmountInput
              label="Amount (XRP)"
              value={refundAmount}
              onChange={setRefundAmount}
              disabled={refundLoading}
            />
            {!validRefundAmount && refundAmount !== "" && (
              <p className="text-[#EF4444] text-xs mt-1">Enter a value between 1 and 500</p>
            )}
            <button
              onClick={handleRefund}
              disabled={refundLoading || !validRefundAmount}
              className="w-full mt-4 bg-[#FEF2F2] hover:bg-[#EF4444] border border-[#FECACA] hover:border-[#EF4444] text-[#EF4444] hover:text-white font-semibold py-3.5 rounded-full transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {refundLoading && <Spinner />}
              {refundLoading ? "Sending Refund…" : "Send Refund"}
            </button>
            {refundError && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3 text-[#EF4444] text-sm">{refundError}</div>
            )}
          </div>
        </div>

        {/* Reset Demo */}
        <div className="max-w-[560px] mx-auto mb-16">
          <button
            onClick={handleDemoReset}
            disabled={resetLoading}
            className="w-full bg-[#F9FAFB] hover:bg-[#FEF2F2] border border-[#E5E7EB] hover:border-red-200 text-[#6B7280] hover:text-[#EF4444] font-medium py-3 rounded-full transition-all text-[0.88rem] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {resetLoading && <Spinner />}
            {resetLoading ? "Resetting…" : "Reset Demo (Send 20 XRP to Alice)"}
          </button>
          {resetError && (
            <div className="mt-2 bg-red-50 border border-red-200 rounded-xl p-3 text-[#EF4444] text-sm text-center">{resetError}</div>
          )}
        </div>
      </div>

      <TransactionLog logs={logs} setLogs={setLogs} />
      <Footer />
    </div>
  );
}

// ── Transaction log (shared across all views) ─────────────────────────────────
function TransactionLog({ logs, setLogs }) {
  return (
    <div className="max-w-5xl mx-auto px-6 pb-16">
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[1rem] font-bold text-[#0D0D0D]">Transaction Log</h2>
          {logs.length > 0 && (
            <button
              onClick={() => { setLogs([]); localStorage.removeItem("unipay-txlog"); }}
              className="text-xs text-gray-300 hover:text-gray-500 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        {logs.length === 0 ? (
          <p className="text-gray-300 text-sm text-center py-4">
            No transactions yet. Choose a role above and try sending XRP.
          </p>
        ) : (
          <div className="space-y-2">
            {logs.map((log, i) => (
              <div key={i} className={`flex items-start justify-between gap-3 p-3 rounded-xl text-sm border ${
                log.type === "error"     ? "bg-red-50 border-red-200 text-red-600"             :
                log.type === "dispute"   ? "bg-orange-50 border-orange-200 text-orange-700"   :
                log.type === "release"   ? "bg-emerald-50 border-emerald-200 text-emerald-700":
                log.type === "milestone" ? "bg-[#EEF2FF] border-[#C7D2FE] text-[#5C47FA]"    :
                "bg-gray-50 border-gray-100 text-gray-700"
              }`}>
                <div className="flex-1 min-w-0">
                  <p>{log.message}</p>
                  {log.hash && (
                    <a
                      href={`https://testnet.xrpl.org/transactions/${log.hash}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-[#5C47FA] hover:text-[#4A38E0] font-mono text-xs break-all underline"
                    >
                      View on XRPL Explorer ↗ {log.hash.slice(0, 16)}…
                    </a>
                  )}
                </div>
                <span className="text-gray-400 text-xs whitespace-nowrap">{log.timestamp}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#E5E7EB] text-center py-5 text-xs text-gray-400">
      Demo runs on XRP Ledger <strong className="text-gray-500">Testnet</strong> — no real money used. ·
      Junaid · Unistellar Admissions Consulting · Abu Dhabi
    </footer>
  );
}
