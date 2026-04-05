"use client";

// useWallet.js — Unified XRPL wallet hook.
// Auto-detects Crossmark first, then falls back to GemWallet.
// Exposes a single normalized interface regardless of which wallet is present.
//
// Returned signAndSubmit always resolves to { hash, sequence } or throws.

import { useState, useEffect, useCallback } from "react";

// ── Crossmark helpers ─────────────────────────────────────────────────────────
function getCrossmark() {
  if (typeof window === "undefined") return null;
  return window.crossmark ?? null;
}

// Resolve the correct submit function — newer Crossmark renamed signAndSubmit
// to signAndSubmitAndWait; we try both so we handle all extension versions.
function getSubmitFn(cm) {
  if (typeof cm.signAndSubmitAndWait === "function") return cm.signAndSubmitAndWait.bind(cm);
  if (typeof cm.signAndSubmit       === "function") return cm.signAndSubmit.bind(cm);
  return null;
}

async function crossmarkConnect() {
  const cm = getCrossmark();
  if (!cm) return null;

  const submitFn = getSubmitFn(cm);
  if (!submitFn) throw new Error("Crossmark: no signAndSubmit method found. Please update your extension.");

  // Submit a no-op AccountSet to get the signed account address
  const res = await submitFn({ TransactionType: "AccountSet", Fee: "12" });
  const addr =
    res?.response?.data?.resp?.result?.Account ??
    res?.response?.data?.Account ??
    res?.request?.body?.Account ??
    null;
  return addr;
}

async function crossmarkSubmit(cm, tx) {
  const submitFn = getSubmitFn(cm);
  if (!submitFn) throw new Error("Crossmark: no signAndSubmit method found. Please update your extension.");
  const raw = await submitFn(tx);
  if (raw?.response?.data?.resp?.result?.hash) {
    return {
      hash: raw.response.data.resp.result.hash,
      sequence: raw.response.data.resp.result.Sequence ?? null,
    };
  }
  throw new Error("Transaction failed or rejected");
}

// ── GemWallet helpers ─────────────────────────────────────────────────────────
async function getGemWalletAPI() {
  if (typeof window === "undefined") return null;
  try {
    const gw = await import("@gemwallet/api");
    const check = await gw.isInstalled();
    if (!check?.result?.isInstalled) return null;
    return gw;
  } catch {
    return null;
  }
}

async function gemConnect(gw) {
  const res = await gw.getAddress();
  return res?.result?.address ?? null;
}

async function gemSubmit(gw, tx) {
  // submitTransaction signs + autofills + submits any raw tx
  const raw = await gw.submitTransaction({ transaction: tx });
  if (raw?.type === "reject") throw new Error("Transaction rejected in GemWallet.");
  const hash = raw?.result?.hash ?? null;
  // GemWallet doesn't return Sequence directly — caller must handle
  return { hash, sequence: null };
}

// ── Main hook ─────────────────────────────────────────────────────────────────
export function useWallet() {
  const [walletName,   setWalletName]   = useState(null);  // 'crossmark' | 'gemwallet' | null
  const [isDetecting,  setIsDetecting]  = useState(true);
  const [isInstalled,  setIsInstalled]  = useState(false);
  const [address,      setAddress]      = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error,        setError]        = useState(null);

  // Detect which wallet is present (Crossmark preferred)
  useEffect(() => {
    let cancelled = false;
    async function detect() {
      // Crossmark: give the extension ~400ms to inject
      await new Promise((r) => setTimeout(r, 400));
      if (cancelled) return;

      const cm = getCrossmark();
      if (cm) {
        try { await cm.ping(); } catch {}
        if (!cancelled) { setWalletName("crossmark"); setIsInstalled(true); setIsDetecting(false); return; }
      }

      // GemWallet
      const gw = await getGemWalletAPI();
      if (!cancelled) {
        if (gw) { setWalletName("gemwallet"); setIsInstalled(true); }
        else     { setWalletName(null);        setIsInstalled(false); }
        setIsDetecting(false);
      }
    }
    detect();
    return () => { cancelled = true; };
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      let addr = null;

      if (walletName === "crossmark") {
        const cm = getCrossmark();
        if (!cm) throw new Error("Crossmark not found.");
        addr = await crossmarkConnect();
      } else if (walletName === "gemwallet") {
        const gw = await getGemWalletAPI();
        if (!gw) throw new Error("GemWallet not found.");
        addr = await gemConnect(gw);
      } else {
        throw new Error("No XRPL wallet detected.");
      }

      if (!addr) throw new Error("Could not retrieve wallet address.");
      setAddress(addr);
    } catch (err) {
      const msg = err?.message ?? "";
      if (/reject|cancel|denied/i.test(msg)) setError("Connection cancelled.");
      else setError(msg || "Failed to connect wallet.");
    } finally {
      setIsConnecting(false);
    }
  }, [walletName]);

  // Unified sign-and-submit — returns { hash, sequence } or throws
  const signAndSubmit = useCallback(
    async (tx) => {
      if (!address) throw new Error("Wallet not connected.");
      const txWithAccount = { ...tx, Account: address };

      if (walletName === "crossmark") {
        const cm = getCrossmark();
        if (!cm) throw new Error("Crossmark not available.");
        return await crossmarkSubmit(cm, txWithAccount);
      }

      if (walletName === "gemwallet") {
        const gw = await getGemWalletAPI();
        if (!gw) throw new Error("GemWallet not available.");
        return await gemSubmit(gw, txWithAccount);
      }

      throw new Error("No wallet available.");
    },
    [address, walletName]
  );

  const disconnect = useCallback(() => {
    setAddress(null);
    setError(null);
  }, []);

  const walletLabel =
    walletName === "crossmark" ? "Crossmark" :
    walletName === "gemwallet" ? "GemWallet"  : null;

  return {
    walletName,
    walletLabel,
    isDetecting,
    isInstalled,
    address,
    isConnecting,
    error,
    connect,
    signAndSubmit,
    disconnect,
  };
}
