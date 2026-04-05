"use client";

import { useState, useEffect } from "react";

export function useCrossmark() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [address, setAddress] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Wait for extension to inject into window
    const timer = setTimeout(() => {
      setIsInstalled(!!window.crossmark);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Resolve the correct submit fn — newer Crossmark renamed signAndSubmit → signAndSubmitAndWait
  function getSubmitFn(cm) {
    if (typeof cm.signAndSubmitAndWait === "function") return cm.signAndSubmitAndWait.bind(cm);
    if (typeof cm.signAndSubmit       === "function") return cm.signAndSubmit.bind(cm);
    return null;
  }

  const connect = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const cm = window.crossmark;
      if (!cm) throw new Error("Crossmark not installed");

      const submitFn = getSubmitFn(cm);
      if (!submitFn) throw new Error("Crossmark: no signAndSubmit method found. Please update your extension.");

      const res = await submitFn({ TransactionType: "AccountSet", Fee: "12" });
      const addr =
        res?.response?.data?.resp?.result?.Account ??
        res?.response?.data?.Account ??
        res?.request?.body?.Account ??
        null;

      if (!addr) throw new Error("Could not get wallet address");
      setAddress(addr);
    } catch (err) {
      setError(err.message || "Connection failed");
    } finally {
      setIsConnecting(false);
    }
  };

  const signAndSubmit = async (tx) => {
    const cm = window.crossmark;
    if (!cm) throw new Error("Crossmark not installed");
    const submitFn = getSubmitFn(cm);
    if (!submitFn) throw new Error("Crossmark: no signAndSubmit method found. Please update your extension.");
    const res = await submitFn(tx);
    if (res?.response?.data?.resp?.result?.hash) {
      return {
        hash: res.response.data.resp.result.hash,
        sequence: res.response.data.resp.result.Sequence ?? null,
      };
    }
    throw new Error("Transaction failed or rejected");
  };

  const disconnect = () => setAddress(null);

  return { isInstalled, address, isConnecting, error, connect, signAndSubmit, disconnect };
}
