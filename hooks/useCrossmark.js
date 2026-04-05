"use client";

import { useState, useEffect, useCallback } from "react";

function getCrossmark() {
  if (typeof window === "undefined") return null;
  return window.crossmark ?? null;
}

// Extract hash from Crossmark's signAndSubmit response
export function extractTxHash(result) {
  return (
    result?.response?.data?.resp?.result?.hash ??
    result?.response?.data?.resp?.result?.tx_json?.hash ??
    null
  );
}

// Extract sequence from Crossmark's signAndSubmit response
export function extractTxSequence(result) {
  return (
    result?.response?.data?.resp?.result?.Sequence ??
    result?.response?.data?.resp?.result?.tx_json?.Sequence ??
    null
  );
}

export function useCrossmark() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [address, setAddress] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Check for Crossmark on mount (brief delay lets the extension inject)
  useEffect(() => {
    async function check() {
      const cm = getCrossmark();
      if (!cm) { setIsInstalled(false); return; }
      try {
        // ping() confirms the extension is active and unlocked
        await cm.ping();
        setIsInstalled(true);
      } catch {
        // Extension present but might be locked — still counts as installed
        setIsInstalled(true);
      }
    }
    const t = setTimeout(check, 400);
    return () => clearTimeout(t);
  }, []);

  const connect = useCallback(async () => {
    const cm = getCrossmark();
    if (!cm) {
      setError("Crossmark extension not found. Please install it at crossmark.io");
      return;
    }
    setIsConnecting(true);
    setError(null);
    try {
      let addr = null;

      // signIn() is the preferred method — returns address without submitting a transaction
      if (typeof cm.signIn === "function") {
        const res = await cm.signIn();
        addr =
          res?.response?.data?.address ??
          res?.data?.address ??
          res?.address;
      }

      // Fallback: sign a zero-cost AccountSet to get the address
      if (!addr) {
        const res = await cm.signAndSubmit({ TransactionType: "AccountSet" });
        addr =
          res?.response?.data?.resp?.result?.tx_json?.Account ??
          res?.response?.data?.resp?.result?.Account ??
          res?.request?.body?.Account;
      }

      if (!addr) throw new Error("Could not retrieve wallet address from Crossmark.");
      setAddress(addr);
    } catch (err) {
      const msg = err?.message ?? "";
      if (/reject|cancel|denied|user/i.test(msg)) {
        setError("Connection cancelled.");
      } else {
        setError(msg || "Failed to connect wallet.");
      }
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Wraps crossmark.signAndSubmit — injects Account automatically
  const signAndSubmit = useCallback(
    async (tx) => {
      const cm = getCrossmark();
      if (!cm) throw new Error("Crossmark not installed");
      if (!address) throw new Error("Wallet not connected");
      const result = await cm.signAndSubmit({ ...tx, Account: address });
      // Surface engine-level failures
      const engineResult =
        result?.response?.data?.resp?.result?.engine_result ??
        result?.response?.data?.resp?.result?.meta?.TransactionResult;
      if (engineResult && engineResult !== "tesSUCCESS") {
        throw new Error(`Transaction failed: ${engineResult}`);
      }
      return result;
    },
    [address]
  );

  const disconnect = useCallback(() => {
    setAddress(null);
    setError(null);
  }, []);

  return {
    isInstalled,
    address,
    isConnecting,
    error,
    connect,
    signAndSubmit,
    disconnect,
  };
}
