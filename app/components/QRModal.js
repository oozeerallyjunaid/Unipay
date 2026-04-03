// QRModal.js — Shows a QR code for a wallet address.
// Uses the `qrcode` npm package to generate a scannable QR image in the browser.

"use client";

import { useEffect, useState } from "react";

export default function QRModal({ isOpen, onClose, address, title }) {
  const [qrDataUrl, setQrDataUrl] = useState(null);

  // Generate QR code as a data URL whenever the modal opens or address changes.
  // We do this inside useEffect so it only runs in the browser (not during server rendering).
  useEffect(() => {
    if (!isOpen || !address) return;

    async function generateQR() {
      const QRCode = (await import("qrcode")).default;
      const url = await QRCode.toDataURL(address, {
        width: 220,
        margin: 2,
        color: {
          dark: "#FFFFFF",  // white dots
          light: "#0F172A", // dark background (matches our slate-900)
        },
      });
      setQrDataUrl(url);
    }

    generateQR();
  }, [isOpen, address]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-72 p-6 relative text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white"
        >
          ✕
        </button>

        <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Wallet Address</p>
        <p className="text-white font-semibold mb-4">{title}</p>

        {/* QR Code image */}
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt={`QR code for ${title}`}
            className="w-52 h-52 mx-auto rounded-xl"
          />
        ) : (
          <div className="w-52 h-52 mx-auto rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 text-sm">
            Generating...
          </div>
        )}

        {/* Full address below the QR */}
        <p className="font-mono text-xs text-slate-400 mt-4 break-all">{address}</p>

        <button
          onClick={onClose}
          className="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 rounded-xl transition-all text-sm"
        >
          Close
        </button>
      </div>
    </div>
  );
}
