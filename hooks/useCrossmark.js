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

  const connect = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const cm = window.crossmark;
      if (!cm) throw new Error("Crossmark not installed");

      let addr = null;

      // Try signIn first (newer Crossmark versions)
      if (typeof cm.signIn === "function") {
        const res = await cm.signIn();
        addr = res?.response?.data?.address || res?.data?.address;
      }

      // Fallback: sign a no-op transaction to get address
      if (!addr) {
        const res = await cm.signAndSubmit({
          TransactionType: "AccountSet",
          Fee: "12",
        });
        addr =
          res?.response?.data?.resp?.result?.Account ||
          res?.request?.body?.Account;
      }

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
    const res = await cm.signAndSubmit(tx);
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
