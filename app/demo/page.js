// app/demo/page.js — Live interactive demo page.
// 3-tab interface: Direct Payment | Escrow Payment | My Dashboard
// All XRPL logic, wallet connections, and transaction functions are unchanged.
// Only the UI organisation has changed.

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import AnimatedMap from "../components/AnimatedMap";
import EscrowList from "../components/EscrowList";

// ── Fetch helpers (unchanged) ──────────────────────────────────────────────────
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

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

// ── Reusable inner field components ───────────────────────────────────────────
function InnerField({ label, children }) {
  return (
    <div className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl p-3">
      <p className="text-[0.68rem] font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      {children}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function DemoPage() {

  // ── Shared wallet state ────────────────────────────────────────────────────
  const [studentAddress,    setStudentAddress]    = useState(null);
  const [consultantAddress, setConsultantAddress] = useState(null);
  const [studentBalance,    setStudentBalance]    = useState(null);
  const [consultantBalance, setConsultantBalance] = useState(null);
  const [xrpPrice,          setXrpPrice]          = useState(null);
  const [loading,           setLoading]           = useState(true);
  const [setupError,        setSetupError]        = useState(null);
  const [refreshing,        setRefreshing]        = useState(false);

  // ── Escrow state (sequence, createdAt, amount, milestone, status) ──────────
  const [escrows, setEscrows] = useState([]);

  // ── Transaction log (persisted to localStorage) ───────────────────────────
  const [logs, setLogs] = useState([]);

  // ── Tab state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("direct");

  // ── Student payment form state (lifted from WalletPanel) ──────────────────
  const [amount,       setAmount]       = useState("10");
  const [milestone,    setMilestone]    = useState("");
  const [loadingState, setLoadingState] = useState(null); // 'pay' | 'escrow' | null
  const [payError,     setPayError]     = useState(null);

  // ── Consultant reset state ─────────────────────────────────────────────────
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError,   setResetError]   = useState(null);

  // ── Balance flash animations ───────────────────────────────────────────────
  const [studentFlash,    setStudentFlash]    = useState(null); // 'up' | 'down' | null
  const [consultantFlash, setConsultantFlash] = useState(null);
  const prevSBal = useRef(null);
  const prevCBal = useRef(null);

  // Persist transaction log
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

  // Clear payment errors when switching tabs
  useEffect(() => { setPayError(null); }, [activeTab]);

  // Student balance flash
  useEffect(() => {
    if (studentBalance == null || prevSBal.current == null) { prevSBal.current = studentBalance; return; }
    const prev = parseFloat(prevSBal.current);
    const curr = parseFloat(studentBalance);
    if (curr > prev)       { setStudentFlash("up");   setTimeout(() => setStudentFlash(null),    1500); }
    else if (curr < prev)  { setStudentFlash("down"); setTimeout(() => setStudentFlash(null),    1500); }
    prevSBal.current = studentBalance;
  }, [studentBalance]);

  // Consultant balance flash
  useEffect(() => {
    if (consultantBalance == null || prevCBal.current == null) { prevCBal.current = consultantBalance; return; }
    const prev = parseFloat(prevCBal.current);
    const curr = parseFloat(consultantBalance);
    if (curr > prev)       { setConsultantFlash("up");   setTimeout(() => setConsultantFlash(null), 1500); }
    else if (curr < prev)  { setConsultantFlash("down"); setTimeout(() => setConsultantFlash(null), 1500); }
    prevCBal.current = consultantBalance;
  }, [consultantBalance]);

  // Initial load: wallets + XRP price
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
      } catch (err) {
        setSetupError(err.message);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Refresh both balances (called after every transaction — unchanged)
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

  function addLog(entry) {
    setLogs((prev) => [entry, ...prev].slice(0, 30));
  }

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

  // ── XRPL transaction handlers (logic unchanged, lifted from WalletPanel) ───

  const validAmount = parseFloat(amount) > 0 && parseFloat(amount) <= 500 && amount !== "";

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
      <div className="min-h-screen bg-white flex items-center justify-center">
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
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="max-w-lg w-full bg-white border border-red-200 rounded-3xl p-8 text-center space-y-4 shadow-lg">
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

  // ── Tab definitions ────────────────────────────────────────────────────────
  const TABS = [
    { id: "direct",    label: "Direct Payment" },
    { id: "escrow",    label: "Escrow Payment" },
    { id: "dashboard", label: "My Dashboard" },
  ];

  // ── Main UI ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Page header */}
      <div className="max-w-6xl mx-auto px-6 pt-10 pb-4 text-center">
        <div className="inline-flex items-center gap-2 bg-[#EEF2FF] border border-[#C7D2FE] text-[#5C47FA] text-xs px-4 py-2 rounded-full mb-4 font-medium">
          <span className="w-2 h-2 rounded-full bg-[#5C47FA] animate-pulse" />
          Live on XRP Ledger Testnet · Real blockchain transactions
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0D0D0D] mb-2">UniPay XRPL — Live Demo</h1>
        <p className="text-gray-500 text-sm max-w-xl mx-auto">
          Alice (student, Mauritius) pays Junaid (consultant, Abu Dhabi) using XRP.
          Try a direct payment or the milestone-based escrow flow below.
        </p>
      </div>

      {/* Manual refresh button */}
      <div className="max-w-6xl mx-auto px-6 pb-4 flex justify-center">
        <button
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 text-sm font-medium px-5 py-2 rounded-full transition-all disabled:opacity-50 shadow-sm"
        >
          <svg className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {refreshing ? "Refreshing…" : "Refresh Balances"}
        </button>
      </div>

      {/* Animated route map — untouched */}
      <div className="max-w-6xl mx-auto px-6 pb-6">
        <AnimatedMap />
      </div>

      {/* ── Tab switcher ──────────────────────────────────────────────────────── */}
      <div className="flex justify-center px-6 mb-8">
        <div className="flex bg-[#F7F8FA] border border-[#E5E7EB] rounded-full p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2.5 rounded-full text-[0.88rem] font-semibold transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-[#5C47FA] text-white shadow-md"
                  : "bg-transparent text-gray-500 hover:text-[#0D0D0D]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ───────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 pb-10">

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: DIRECT PAYMENT                                               */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {activeTab === "direct" && (
          <div className="max-w-[520px] mx-auto">

            {/* Section header */}
            <div className="text-center mb-6">
              <h2 className="text-[1.2rem] font-bold text-[#0D0D0D]">Send a Direct Payment</h2>
              <p className="text-[0.88rem] text-gray-400 mt-1">
                Sends XRP instantly to your consultant. Settles on-chain in 3–5 seconds.
              </p>
            </div>

            {/* Alice's wallet card */}
            <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-7">

              {/* Top row */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-bold text-[1.2rem] text-[#0D0D0D]">Alice</p>
                  <span className="inline-block mt-1 bg-[#EEF2FF] text-[#5C47FA] rounded-full text-[0.68rem] font-semibold px-2.5 py-0.5">
                    STUDENT · MAURITIUS
                  </span>
                </div>
                <span className="text-[1.4rem]">🇲🇺</span>
              </div>

              {/* Wallet address */}
              <div className="mb-3">
                <InnerField label="Wallet Address">
                  <p className="font-mono text-[0.82rem] text-[#0D0D0D] break-all">{studentAddress || "Loading…"}</p>
                </InnerField>
              </div>

              {/* Balance */}
              <InnerField label="XRP Balance">
                <div className="flex items-baseline gap-2">
                  <span className={`text-[1.6rem] font-extrabold transition-colors duration-700 ${sBColor}`}>
                    {studentBalance ? parseFloat(studentBalance).toFixed(2) : "—"}
                  </span>
                  <span className="text-[0.9rem] text-gray-400 font-medium">XRP</span>
                  {studentFlash === "up"   && <span className="text-[#00B67A] animate-bounce">↑</span>}
                  {studentFlash === "down" && <span className="text-orange-500 animate-bounce">↓</span>}
                </div>
                {studentUsd && <p className="text-[0.82rem] text-gray-400 mt-0.5">≈ ${studentUsd} USD</p>}
              </InnerField>

              <div className="border-t border-[#E5E7EB] my-5" />

              {/* Amount input row */}
              <div className="flex items-center gap-3 mb-1">
                <label className="text-[0.88rem] font-medium text-gray-600 whitespace-nowrap">Amount (XRP)</label>
                <input
                  type="number" min="1" max="500" step="1"
                  value={amount} onChange={(e) => setAmount(e.target.value)}
                  disabled={loadingState !== null}
                  className="bg-white border-[1.5px] border-[#E5E7EB] focus:border-[#5C47FA] focus:ring-2 focus:ring-[#5C47FA]/10 rounded-[10px] px-3.5 py-2.5 text-[0.95rem] text-[#0D0D0D] w-[120px] outline-none transition-all"
                />
                {!validAmount && amount !== "" && (
                  <span className="text-[#EF4444] text-xs">1–500 XRP</span>
                )}
              </div>

              {/* Recipient info */}
              <p className="text-[0.78rem] text-gray-400 mb-5">
                Sending to: Junaid — Unistellar Admissions, Abu Dhabi 🇦🇪
              </p>

              {/* Send button */}
              <button
                onClick={handleDirectPayment}
                disabled={loadingState !== null || !validAmount}
                className="w-full bg-[#5C47FA] hover:bg-[#4534E0] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-full transition-all flex items-center justify-center gap-2 text-[0.95rem]"
              >
                {loadingState === "pay" && <Spinner />}
                {loadingState === "pay" ? "Sending…" : `Send ${validAmount ? amount : "?"} XRP`}
              </button>

              {payError && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3 text-[#EF4444] text-sm">
                  {payError}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: ESCROW PAYMENT                                               */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {activeTab === "escrow" && (
          <div className="max-w-[520px] mx-auto">

            {/* Section header */}
            <div className="text-center mb-6">
              <h2 className="text-[1.2rem] font-bold text-[#0D0D0D]">Lock Payment in Escrow</h2>
              <p className="text-[0.88rem] text-gray-400 mt-1">
                Funds are held on-chain and only release when a milestone is confirmed — by both parties.
              </p>
            </div>

            {/* Info banner */}
            <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl p-4 mb-6">
              <p className="text-[0.82rem] text-[#3730A3]">
                Your money stays locked until the agreed milestone is completed. If the consultant doesn't deliver, you can reclaim it.
              </p>
            </div>

            {/* Alice's wallet card */}
            <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-7">

              {/* Top row */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-bold text-[1.2rem] text-[#0D0D0D]">Alice</p>
                  <span className="inline-block mt-1 bg-[#EEF2FF] text-[#5C47FA] rounded-full text-[0.68rem] font-semibold px-2.5 py-0.5">
                    STUDENT · MAURITIUS
                  </span>
                </div>
                <span className="text-[1.4rem]">🇲🇺</span>
              </div>

              {/* Wallet address */}
              <div className="mb-3">
                <InnerField label="Wallet Address">
                  <p className="font-mono text-[0.82rem] text-[#0D0D0D] break-all">{studentAddress || "Loading…"}</p>
                </InnerField>
              </div>

              {/* Balance */}
              <InnerField label="XRP Balance">
                <div className="flex items-baseline gap-2">
                  <span className={`text-[1.6rem] font-extrabold transition-colors duration-700 ${sBColor}`}>
                    {studentBalance ? parseFloat(studentBalance).toFixed(2) : "—"}
                  </span>
                  <span className="text-[0.9rem] text-gray-400 font-medium">XRP</span>
                  {studentFlash === "up"   && <span className="text-[#00B67A] animate-bounce">↑</span>}
                  {studentFlash === "down" && <span className="text-orange-500 animate-bounce">↓</span>}
                </div>
                {studentUsd && <p className="text-[0.82rem] text-gray-400 mt-0.5">≈ ${studentUsd} USD</p>}
              </InnerField>

              <div className="border-t border-[#E5E7EB] my-5" />

              {/* Amount input */}
              <div className="flex items-center gap-3 mb-4">
                <label className="text-[0.88rem] font-medium text-gray-600 whitespace-nowrap">Amount (XRP)</label>
                <input
                  type="number" min="1" max="500" step="1"
                  value={amount} onChange={(e) => setAmount(e.target.value)}
                  disabled={loadingState !== null}
                  className="bg-white border-[1.5px] border-[#E5E7EB] focus:border-[#5C47FA] focus:ring-2 focus:ring-[#5C47FA]/10 rounded-[10px] px-3.5 py-2.5 text-[0.95rem] text-[#0D0D0D] w-[120px] outline-none transition-all"
                />
                {!validAmount && amount !== "" && (
                  <span className="text-[#EF4444] text-xs">1–500 XRP</span>
                )}
              </div>

              {/* Milestone input */}
              <div className="mb-5">
                <label className="block text-[0.88rem] font-medium text-gray-600 mb-1.5">
                  Milestone Description
                </label>
                <input
                  type="text"
                  placeholder='e.g. "Personal statement submitted"'
                  value={milestone} onChange={(e) => setMilestone(e.target.value)}
                  disabled={loadingState !== null}
                  maxLength={80}
                  className="w-full bg-white border-[1.5px] border-[#E5E7EB] focus:border-[#5C47FA] focus:ring-2 focus:ring-[#5C47FA]/10 rounded-[10px] px-3.5 py-2.5 text-[0.88rem] text-[#0D0D0D] outline-none transition-all placeholder:text-gray-300"
                />
              </div>

              {/* Escrow button */}
              <button
                onClick={handleCreateEscrow}
                disabled={loadingState !== null || !validAmount}
                className="w-full bg-[#0D0D0D] hover:bg-[#1f1f1f] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-full transition-all flex items-center justify-center gap-2"
              >
                {loadingState === "escrow" && <Spinner />}
                {loadingState === "escrow" ? "Creating Escrow…" : `Lock ${validAmount ? amount : "?"} XRP in Escrow`}
              </button>

              <p className="text-[0.75rem] text-gray-400 text-center mt-2">
                Both parties must confirm to release. Settles via XRP Ledger EscrowCreate.
              </p>

              {payError && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3 text-[#EF4444] text-sm">
                  {payError}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* TAB 3: MY DASHBOARD (Consultant view)                               */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {activeTab === "dashboard" && (
          <div className="max-w-[680px] mx-auto">

            {/* Section header */}
            <div className="text-center mb-6">
              <h2 className="text-[1.2rem] font-bold text-[#0D0D0D]">Consultant Dashboard</h2>
              <p className="text-[0.88rem] text-gray-400 mt-1">Unistellar Admissions · Abu Dhabi 🇦🇪</p>
            </div>

            {/* Balance card */}
            <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-7 mb-4">

              {/* Top row */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-bold text-[1.2rem] text-[#0D0D0D]">Junaid</p>
                  <span className="inline-block mt-1 bg-[#EEF2FF] text-[#5C47FA] rounded-full text-[0.68rem] font-semibold px-2.5 py-0.5">
                    UNISTELLAR ADMISSIONS · ABU DHABI
                  </span>
                </div>
                <span className="text-[1.4rem]">🇦🇪</span>
              </div>

              {/* Wallet address */}
              <InnerField label="Wallet Address">
                <p className="font-mono text-[0.82rem] text-[#0D0D0D] break-all">{consultantAddress || "Loading…"}</p>
              </InnerField>

              {/* Balance display */}
              <div className="flex items-center justify-between mt-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-[2.4rem] font-extrabold transition-colors duration-700 leading-none ${cBColor}`}>
                      {consultantBalance ? parseFloat(consultantBalance).toFixed(2) : "—"}
                    </span>
                    <span className="text-[1rem] text-gray-400 font-medium">XRP</span>
                    {consultantFlash === "up"   && <span className="text-[#00B67A] text-xl animate-bounce">↑</span>}
                    {consultantFlash === "down" && <span className="text-orange-500 text-xl animate-bounce">↓</span>}
                  </div>
                  {consultantUsd && <p className="text-[0.9rem] text-gray-400 mt-0.5">≈ ${consultantUsd} USD</p>}
                </div>

                {/* Refresh button */}
                <button
                  onClick={handleManualRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-1.5 bg-[#F7F8FA] hover:bg-[#E5E7EB] border border-[#E5E7EB] text-gray-600 rounded-full px-3.5 py-1.5 text-[0.78rem] font-medium transition-all disabled:opacity-50"
                >
                  <svg className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {refreshing ? "Refreshing…" : "Refresh Balance"}
                </button>
              </div>
            </div>

            {/* Active Escrows card */}
            <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-7 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[1rem] text-[#0D0D0D]">Active Escrows</h3>
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

            {/* Reset Demo button */}
            <button
              onClick={handleDemoReset}
              disabled={resetLoading}
              className="w-full bg-[#FEF2F2] hover:bg-red-100 border border-[#FECACA] text-[#EF4444] font-medium py-3 rounded-full transition-all text-[0.88rem] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {resetLoading && <Spinner />}
              {resetLoading ? "Resetting…" : "Reset Demo (Send 20 XRP to Alice)"}
            </button>
            {resetError && (
              <div className="mt-2 bg-red-50 border border-red-200 rounded-xl p-3 text-[#EF4444] text-sm text-center">
                {resetError}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Transaction log ────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 pb-16">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0D0D0D]">Transaction Log</h2>
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
              No transactions yet. Try sending XRP or creating an escrow above.
            </p>
          ) : (
            <div className="space-y-2">
              {logs.map((log, i) => (
                <div key={i} className={`flex items-start justify-between gap-3 p-3 rounded-xl text-sm border ${
                  log.type === "error"     ? "bg-red-50 border-red-200 text-red-600"              :
                  log.type === "dispute"   ? "bg-orange-50 border-orange-200 text-orange-700"     :
                  log.type === "release"   ? "bg-emerald-50 border-emerald-200 text-emerald-700"  :
                  log.type === "milestone" ? "bg-[#EEF2FF] border-[#C7D2FE] text-[#5C47FA]"      :
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

      <footer className="border-t border-gray-100 text-center py-5 text-xs text-gray-400">
        Demo runs on XRP Ledger <strong className="text-gray-500">Testnet</strong> — no real money used. ·
        Junaid · Unistellar Admissions Consulting · Abu Dhabi
      </footer>
    </div>
  );
}
