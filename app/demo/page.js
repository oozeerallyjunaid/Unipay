// app/demo/page.js — Live interactive demo page.
// Architecture: Crossmark or GemWallet signs all transactions client-side.
// No private keys on the server. All XRPL I/O uses xrpl.js in the browser.

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import AnimatedMap from "../components/AnimatedMap";
import EscrowList from "../components/EscrowList";
import WalletConnect from "../components/WalletConnect";
import { useWallet } from "../../hooks/useWallet";

// ── Demo constants ─────────────────────────────────────────────────────────────
// These are the "story" wallet addresses used as payment destinations.
// The actual SIGNER is whoever connects via Crossmark.
const CONSULTANT_ADDRESS = "rN5iynKM9nigWAh2SLGisQaJhgbG1fopzt"; // Junaid — Abu Dhabi
const STUDENT_ADDRESS    = "rBbJMggmFdnAxEo7dm38MPwo9yRv2VVFjb";  // Alice — Mauritius
const XRPL_WS            = "wss://s.altnet.rippletest.net:51233";
const RIPPLE_EPOCH       = 946684800; // seconds between Unix epoch and Ripple epoch

// ── XRPL client-side helpers ──────────────────────────────────────────────────
function xrpToDrops(xrp) {
  return String(Math.floor(parseFloat(xrp) * 1_000_000));
}

function unixToRippleTime(unixSeconds) {
  return Math.floor(unixSeconds) - RIPPLE_EPOCH;
}

async function fetchXrplBalance(address) {
  try {
    const { Client } = await import("xrpl");
    const client = new Client(XRPL_WS);
    await client.connect();
    const res = await client.request({
      command: "account_info",
      account: address,
      ledger_index: "validated",
    });
    await client.disconnect();
    return (Number(res.result.account_data.Balance) / 1_000_000).toFixed(2);
  } catch {
    return null;
  }
}

async function fetchXrplTransactions(address) {
  try {
    const { Client } = await import("xrpl");
    const client = new Client(XRPL_WS);
    await client.connect();
    const res = await client.request({
      command: "account_tx",
      account: address,
      limit: 10,
    });
    await client.disconnect();
    return res.result.transactions ?? [];
  } catch {
    return [];
  }
}

async function fetchXrpPrice() {
  try {
    const res  = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd");
    const data = await res.json();
    return data?.ripple?.usd ?? null;
  } catch { return null; }
}

// ── Page top section (stable component outside DemoPage) ──────────────────────
function PageTop({ onRefresh, refreshing }) {
  return (
    <>
      <div className="text-center pt-4 pb-2">
        <div className="inline-flex items-center gap-2 bg-[#EEF2FF] border border-[#C7D2FE] text-[#5C47FA] text-xs px-4 py-2 rounded-full mb-2 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#5C47FA] animate-pulse" />
          Live on XRP Ledger Testnet
        </div>
        <h1 className="text-3xl font-extrabold text-[#0D0D0D]">UniPay XRPL</h1>
      </div>
      <div className="flex justify-center pb-2">
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
      <div className="max-w-5xl mx-auto px-6 pb-3" style={{ maxHeight: "300px", overflow: "hidden" }}>
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

  // ── Wallet hook (Crossmark or GemWallet, auto-detected) ───────────────────
  const {
    walletLabel, isDetecting, isInstalled,
    address, isConnecting, error: cmError,
    connect, signAndSubmit, disconnect,
  } = useWallet();

  // ── Role + wallet connection flow ──────────────────────────────────────────
  const [role,            setRole]            = useState(null);  // null | 'customer' | 'consultant'
  const [walletConnected, setWalletConnected] = useState(false);

  // ── Balances ───────────────────────────────────────────────────────────────
  const [balance,    setBalance]    = useState(null); // connected wallet balance
  const [xrpPrice,   setXrpPrice]   = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // ── Escrow state (persisted to localStorage) ───────────────────────────────
  const [escrows, setEscrows] = useState([]);

  // ── Transaction log ────────────────────────────────────────────────────────
  const [logs, setLogs] = useState([]);

  // ── Payment form state ─────────────────────────────────────────────────────
  const [amount,       setAmount]       = useState("10");
  const [milestone,    setMilestone]    = useState("");
  const [loadingState, setLoadingState] = useState(null); // 'pay' | 'escrow' | null
  const [payError,     setPayError]     = useState(null);

  // ── Balance flash ──────────────────────────────────────────────────────────
  const [balFlash, setBalFlash] = useState(null); // 'up' | 'down' | null
  const prevBal = useRef(null);

  // ── Persist logs ───────────────────────────────────────────────────────────
  useEffect(() => {
    try { const s = localStorage.getItem("unipay-txlog"); if (s) setLogs(JSON.parse(s)); } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem("unipay-txlog", JSON.stringify(logs)); } catch {}
  }, [logs]);

  // ── Persist escrows ────────────────────────────────────────────────────────
  useEffect(() => {
    try { const s = localStorage.getItem("unipay-escrows"); if (s) setEscrows(JSON.parse(s)); } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem("unipay-escrows", JSON.stringify(escrows)); } catch {}
  }, [escrows]);

  // ── XRP price (once) ───────────────────────────────────────────────────────
  useEffect(() => { fetchXrpPrice().then(setXrpPrice); }, []);

  // ── Clear errors on role change ────────────────────────────────────────────
  useEffect(() => { setPayError(null); }, [role]);

  // ── Balance flash ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (balance == null || prevBal.current == null) { prevBal.current = balance; return; }
    const prev = parseFloat(prevBal.current), curr = parseFloat(balance);
    if (curr > prev)      { setBalFlash("up");   setTimeout(() => setBalFlash(null), 1500); }
    else if (curr < prev) { setBalFlash("down"); setTimeout(() => setBalFlash(null), 1500); }
    prevBal.current = balance;
  }, [balance]);

  // ── Consultant: skip wallet step, load balance from known address ──────────
  useEffect(() => {
    if (role !== "consultant" || walletConnected) return;
    setWalletConnected(true);
    fetchXrplBalance(CONSULTANT_ADDRESS).then((bal) => { if (bal) setBalance(bal); });
  }, [role, walletConnected]);

  // ── Customer: auto-transition after Crossmark connects ────────────────────
  useEffect(() => {
    if (role !== "customer" || !address || walletConnected) return;
    fetchXrplBalance(address).then((bal) => { if (bal) setBalance(bal); });
    const t = setTimeout(() => setWalletConnected(true), 1000);
    return () => clearTimeout(t);
  }, [role, address, walletConnected]);

  // ── Refresh balance ────────────────────────────────────────────────────────
  const refreshBalance = useCallback(async () => {
    const target = role === "consultant" ? CONSULTANT_ADDRESS : address;
    if (!target) return;
    const bal = await fetchXrplBalance(target);
    if (bal !== null) setBalance(bal);
  }, [address, role]);

  async function handleManualRefresh() {
    setRefreshing(true);
    await refreshBalance();
    setRefreshing(false);
  }

  function addLog(entry) { setLogs((prev) => [entry, ...prev].slice(0, 30)); }

  // ── Confetti ───────────────────────────────────────────────────────────────
  async function fireConfetti() {
    try {
      const confetti = (await import("canvas-confetti")).default;
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ["#5C47FA", "#00B67A", "#F59E0B", "#8B5CF6"] });
    } catch {}
  }

  // ── Escrow state machine ───────────────────────────────────────────────────
  function handleEscrowCreated(sequence, createdAt, amt, ms, owner) {
    setEscrows((prev) => [{ sequence, createdAt, amount: amt, milestone: ms, status: "locked", owner }, ...prev]);
  }
  function handleMarkDone(sequence) {
    setEscrows((prev) => prev.map((e) => e.sequence === sequence ? { ...e, status: "milestone_done" } : e));
  }
  function handleEscrowRemoved(sequence) {
    setEscrows((prev) => prev.filter((e) => e.sequence !== sequence));
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const validAmount = parseFloat(amount) > 0 && parseFloat(amount) <= 500 && amount !== "";
  const usdValue    = balance && xrpPrice ? (parseFloat(balance) * xrpPrice).toFixed(2) : null;
  const bColor = balFlash === "up" ? "text-[#00B67A]" : balFlash === "down" ? "text-orange-500" : "text-[#0D0D0D]";

  // ── XRPL transaction handlers (all signed via Crossmark) ──────────────────

  async function handleDirectPayment() {
    if (!validAmount || !address) return;
    setLoadingState("pay"); setPayError(null);
    try {
      const destination = role === "customer" ? CONSULTANT_ADDRESS : STUDENT_ADDRESS;
      const { hash } = await signAndSubmit({
        TransactionType: "Payment",
        Destination: destination,
        Amount: xrpToDrops(amount),
      });
      await fireConfetti();
      addLog({
        type: "payment",
        message: `✅ Sent ${amount} XRP → ${destination.slice(0, 8)}…`,
        hash,
        timestamp: new Date().toLocaleTimeString(),
      });
      await refreshBalance();
    } catch (err) {
      setPayError(err.message);
      addLog({ type: "error", message: `❌ Payment failed: ${err.message}`, timestamp: new Date().toLocaleTimeString() });
    } finally { setLoadingState(null); }
  }

  async function handleCreateEscrow() {
    if (!validAmount || !address) return;
    setLoadingState("escrow"); setPayError(null);
    try {
      const now = Date.now() / 1000;
      const { hash, sequence } = await signAndSubmit({
        TransactionType: "EscrowCreate",
        Destination: CONSULTANT_ADDRESS,
        Amount: xrpToDrops(amount),
        FinishAfter: unixToRippleTime(now + 30),   // 30s demo window
        CancelAfter: unixToRippleTime(now + 90),   // 90s dispute window
      });
      const ms       = milestone.trim() || "Service delivery";
      addLog({
        type: "escrow",
        message: `🔒 Locked ${amount} XRP in escrow #${sequence} — Milestone: "${ms}"`,
        hash,
        timestamp: new Date().toLocaleTimeString(),
      });
      handleEscrowCreated(sequence, Date.now(), amount, ms, address);
      setMilestone("");
      await refreshBalance();
    } catch (err) {
      setPayError(err.message);
      addLog({ type: "error", message: `❌ Escrow failed: ${err.message}`, timestamp: new Date().toLocaleTimeString() });
    } finally { setLoadingState(null); }
  }

  // Called by EscrowList when consultant clicks "Confirm & Release"
  async function handleEscrowFinish(sequence, owner) {
    if (!address) {
      return { ok: false, error: "Connect your wallet (as Customer) to sign this transaction." };
    }
    try {
      const { hash } = await signAndSubmit({
        TransactionType: "EscrowFinish",
        Owner: owner || STUDENT_ADDRESS,
        OfferSequence: sequence,
      });
      addLog({
        type: "release",
        message: `✅ Escrow #${sequence} released — funds sent to consultant`,
        hash,
        timestamp: new Date().toLocaleTimeString(),
      });
      handleEscrowRemoved(sequence);
      await refreshBalance();
      return { ok: true, hash };
    } catch (err) {
      addLog({ type: "error", message: `❌ Release failed: ${err.message}`, timestamp: new Date().toLocaleTimeString() });
      return { ok: false, error: err.message };
    }
  }

  // Called by EscrowList when consultant clicks "Dispute & Reclaim"
  async function handleEscrowCancel(sequence, owner) {
    if (!address) {
      return { ok: false, error: "Connect your wallet (as Customer) to sign this transaction." };
    }
    try {
      const { hash } = await signAndSubmit({
        TransactionType: "EscrowCancel",
        Owner: owner || STUDENT_ADDRESS,
        OfferSequence: sequence,
      });
      addLog({
        type: "dispute",
        message: `⚠️ Escrow #${sequence} cancelled — funds returned to customer`,
        hash,
        timestamp: new Date().toLocaleTimeString(),
      });
      handleEscrowRemoved(sequence);
      await refreshBalance();
      return { ok: true, hash };
    } catch (err) {
      addLog({ type: "error", message: `❌ Dispute failed: ${err.message}`, timestamp: new Date().toLocaleTimeString() });
      return { ok: false, error: err.message };
    }
  }

  // ── Refresh XRPL transaction history into the log ─────────────────────────
  async function loadTxHistory() {
    if (!address) return;
    const txs = await fetchXrplTransactions(address);
    const entries = txs.slice(0, 5).map((tx) => {
      const meta  = tx.meta ?? tx.metaData;
      const txn   = tx.tx   ?? tx.transaction ?? tx;
      const type  = txn.TransactionType;
      const ok    = meta?.TransactionResult === "tesSUCCESS";
      const drops = txn.Amount && typeof txn.Amount === "string" ? txn.Amount : null;
      const xrp   = drops ? (Number(drops) / 1_000_000).toFixed(2) : null;
      return {
        type: ok ? "payment" : "error",
        message: `${ok ? "✅" : "❌"} ${type}${xrp ? ` · ${xrp} XRP` : ""}`,
        hash: txn.hash,
        timestamp: txn.date
          ? new Date((txn.date + RIPPLE_EPOCH) * 1000).toLocaleTimeString()
          : "on-chain",
      };
    });
    if (entries.length > 0) setLogs((prev) => [...entries, ...prev].slice(0, 30));
  }

  // ── Role switch ────────────────────────────────────────────────────────────
  function switchRole() {
    setRole(null);
    setWalletConnected(false);
    disconnect();
    setBalance(null);
    setPayError(null);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ROLE SELECTION SCREEN
  // ══════════════════════════════════════════════════════════════════════════════
  if (role === null) {
    return (
      <div className="bg-[#F5F4FF]">
        <div className="max-w-5xl mx-auto px-6">
          <PageTop onRefresh={handleManualRefresh} refreshing={refreshing} />

          <div className="text-center pt-3 pb-5">
            <h2 className="text-[2rem] font-extrabold text-[#0D0D0D] leading-tight">
              Who are you today?
            </h2>
            <p className="text-[0.95rem] text-gray-400 mt-2">Select your role to get started</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pb-8">

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
  // WALLET CONNECTION STEP — customers only (consultant skips this)
  // ══════════════════════════════════════════════════════════════════════════════
  if (role === "customer" && !walletConnected) {
    return (
      <div className="bg-[#F5F4FF]">
        <div className="max-w-5xl mx-auto px-6">
          <PageTop onRefresh={handleManualRefresh} refreshing={refreshing} />
        </div>
        <WalletConnect
          role={role}
          walletLabel={walletLabel}
          isDetecting={isDetecting}
          isInstalled={isInstalled}
          isConnecting={isConnecting}
          address={address}
          error={cmError}
          onConnect={connect}
          onBack={switchRole}
        />
      </div>
    );
  }

  // ── Truncated address for display ──────────────────────────────────────────
  const shortAddress = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : "—";

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
              onClick={switchRole}
              className="text-[0.82rem] text-gray-400 hover:text-[#5C47FA] transition-colors mb-4 flex items-center gap-1"
            >
              ← Switch role
            </button>
            <div className="text-center">
              <h2 className="text-[1.4rem] font-extrabold text-[#0D0D0D]">Customer Portal</h2>
              <span className="inline-block mt-2 bg-[#EEF2FF] text-[#5C47FA] rounded-full text-[0.78rem] font-semibold px-3.5 py-1 border border-[#C7D2FE]">
                {walletLabel ?? "Wallet"} Connected
              </span>
            </div>
          </div>

          {/* Wallet Summary Card */}
          <div className="max-w-[480px] mx-auto mb-6">
            <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-[0.68rem] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Connected Wallet
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#00B67A] flex-shrink-0" />
                    <p className="font-mono text-[0.82rem] text-[#0D0D0D]">{address}</p>
                  </div>
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
                  <span className={`text-[2rem] font-extrabold transition-colors duration-700 ${bColor}`}>
                    {balance ?? "—"}
                  </span>
                  <span className="text-[0.9rem] text-gray-400 font-medium">XRP</span>
                  {balFlash === "up"   && <span className="text-[#00B67A] animate-bounce">↑</span>}
                  {balFlash === "down" && <span className="text-orange-500 animate-bounce">↓</span>}
                </div>
                {usdValue && <p className="text-[0.82rem] text-gray-400 mt-0.5">≈ ${usdValue} USD</p>}
                {balance === "0.00" && (
                  <p className="text-[0.75rem] text-amber-600 mt-2">
                    No testnet XRP?{" "}
                    <a href="https://faucet.tequ.dev" target="_blank" rel="noopener noreferrer" className="text-[#5C47FA] hover:underline">
                      Get free testnet XRP →
                    </a>
                  </p>
                )}
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
                <p className="font-mono text-[0.72rem] text-gray-400 mt-0.5">{CONSULTANT_ADDRESS}</p>
              </div>
              <AmountInput label="Amount (XRP)" value={amount} onChange={setAmount} disabled={loadingState !== null} />
              {!validAmount && amount !== "" && (
                <p className="text-[#EF4444] text-xs mt-1">Enter a value between 1 and 500</p>
              )}
              <button
                onClick={handleDirectPayment}
                disabled={loadingState !== null || !validAmount}
                className="w-full mt-4 bg-[#5C47FA] hover:bg-[#4534E0] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-full transition-all flex items-center justify-center gap-2"
              >
                {loadingState === "pay" && <Spinner />}
                {loadingState === "pay" ? `Signing with ${walletLabel ?? "wallet"}…` : "Send Payment"}
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
            <div className="bg-[#F5F4FF] border border-[#C7D2FE] rounded-xl p-3.5 mb-4">
              <p className="text-[0.8rem] text-[#4338CA]">
                Funds are locked on-chain and only release when your consultant completes the agreed milestone.
              </p>
            </div>
            <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-6">
              <AmountInput label="Amount (XRP)" value={amount} onChange={setAmount} disabled={loadingState !== null} />
              <div className="mt-3">
                <label className="block text-[0.82rem] font-medium text-[#4B5563] mb-1">
                  Milestone Description
                </label>
                <textarea
                  placeholder='e.g. "Personal statement submitted"'
                  value={milestone} onChange={(e) => setMilestone(e.target.value)}
                  disabled={loadingState !== null}
                  maxLength={120} rows={3}
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
                {loadingState === "escrow" ? `Signing with ${walletLabel ?? "wallet"}…` : "Lock in Escrow"}
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

        <TransactionLog logs={logs} setLogs={setLogs} onLoadFromChain={loadTxHistory} />
        <Footer />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // CONSULTANT INTERFACE
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div className="bg-[#F5F4FF]">
      <div className="max-w-5xl mx-auto px-6">
        <PageTop onRefresh={handleManualRefresh} refreshing={refreshing} />

        {/* Back link + header */}
        <div className="max-w-[560px] mx-auto mb-6">
          <button
            onClick={switchRole}
            className="text-[0.82rem] text-gray-400 hover:text-[#5C47FA] transition-colors mb-4 flex items-center gap-1"
          >
            ← Switch role
          </button>
          <div className="text-center">
            <h2 className="text-[1.4rem] font-extrabold text-[#0D0D0D]">Consultant Dashboard</h2>
            <span className="inline-block mt-2 bg-[#F0FDF4] text-[#059669] rounded-full text-[0.78rem] font-semibold px-3.5 py-1 border border-[#BBF7D0]">
              Read-only · No wallet needed
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
              <span className={`text-[2.8rem] font-extrabold leading-none transition-colors duration-700 ${bColor}`}>
                {balance ?? "—"}
              </span>
              <span className="text-[1rem] text-gray-400 font-medium">XRP</span>
              {balFlash === "up"   && <span className="text-[#00B67A] text-xl animate-bounce">↑</span>}
              {balFlash === "down" && <span className="text-orange-500 text-xl animate-bounce">↓</span>}
            </div>
            {usdValue && <p className="text-[0.88rem] text-gray-400 mt-1">≈ ${usdValue} USD</p>}
            <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
              <p className="text-[0.68rem] font-semibold text-gray-400 uppercase tracking-wider mb-1">Consultant Address</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00B67A] flex-shrink-0" />
                <p className="font-mono text-[0.82rem] text-[#0D0D0D] break-all">{CONSULTANT_ADDRESS}</p>
              </div>
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
              onRelease={handleEscrowFinish}
              onDispute={handleEscrowCancel}
              onLog={addLog}
            />
          </div>
        </div>

        {/* Reset Demo */}
        <div className="max-w-[560px] mx-auto mb-16">
          <button
            onClick={() => {
              setEscrows([]);
              localStorage.removeItem("unipay-escrows");
              addLog({ type: "payment", message: "🔄 Escrow list cleared (demo reset)", timestamp: new Date().toLocaleTimeString() });
            }}
            className="w-full bg-[#F9FAFB] hover:bg-[#FEF2F2] border border-[#E5E7EB] hover:border-red-200 text-[#6B7280] hover:text-[#EF4444] font-medium py-3 rounded-full transition-all text-[0.88rem] flex items-center justify-center gap-2"
          >
            Reset Demo (Clear Escrow List)
          </button>
        </div>
      </div>

      <TransactionLog logs={logs} setLogs={setLogs} onLoadFromChain={loadTxHistory} />
      <Footer />
    </div>
  );
}

// ── Transaction log ────────────────────────────────────────────────────────────
function TransactionLog({ logs, setLogs, onLoadFromChain }) {
  return (
    <div className="max-w-5xl mx-auto px-6 pb-16">
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[1rem] font-bold text-[#0D0D0D]">Transaction Log</h2>
          <div className="flex items-center gap-3">
            {onLoadFromChain && (
              <button
                onClick={onLoadFromChain}
                className="text-xs text-[#5C47FA] hover:text-[#4534E0] transition-colors font-medium"
              >
                Load from chain
              </button>
            )}
            {logs.length > 0 && (
              <button
                onClick={() => { setLogs([]); localStorage.removeItem("unipay-txlog"); }}
                className="text-xs text-gray-300 hover:text-gray-500 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        {logs.length === 0 ? (
          <p className="text-gray-300 text-sm text-center py-4">
            No transactions yet. Connect a wallet and send XRP.
          </p>
        ) : (
          <div className="space-y-2">
            {logs.map((log, i) => (
              <div key={i} className={`flex items-start justify-between gap-3 p-3 rounded-xl text-sm border ${
                log.type === "error"     ? "bg-red-50 border-red-200 text-red-600"              :
                log.type === "dispute"   ? "bg-orange-50 border-orange-200 text-orange-700"    :
                log.type === "release"   ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                log.type === "milestone" ? "bg-[#EEF2FF] border-[#C7D2FE] text-[#5C47FA]"     :
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
    <footer className="border-t border-[#E5E7EB] bg-white py-8 px-6 text-center">
      <p className="text-gray-400 text-sm">
        Built on{" "}
        <a href="https://xrpl.org" target="_blank" rel="noopener noreferrer" className="text-[#5C47FA] hover:underline">
          XRP Ledger
        </a>{" "}
        · Signed by{" "}
        <a href="https://crossmark.io" target="_blank" rel="noopener noreferrer" className="text-[#5C47FA] hover:underline">
          Crossmark
        </a>{" "}
        /{" "}
        <a href="https://gemwallet.app" target="_blank" rel="noopener noreferrer" className="text-[#5C47FA] hover:underline">
          GemWallet
        </a>{" "}
        · Testnet demo
      </p>
    </footer>
  );
}
