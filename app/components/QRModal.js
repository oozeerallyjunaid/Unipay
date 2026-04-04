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
          dark: "#1F2937",  // dark dots
          light: "#FFFFFF", // white background
        },
      });
      setQrDataUrl(url);
    }

    generateQR();
  }, [isOpen, address]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-gray-200 rounded-2xl w-72 p-6 relative text-center shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
        >
          ✕
        </button>

        <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Wallet Address</p>
        <p className="text-gray-900 font-semibold mb-4">{title}</p>

        {/* QR Code image */}
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt={`QR code for ${title}`}
            className="w-52 h-52 mx-auto rounded-xl border border-gray-100"
          />
        ) : (
          <div className="w-52 h-52 mx-auto rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 text-sm">
            Generating...
          </div>
        )}

        {/* Full address below the QR */}
        <p className="font-mono text-xs text-gray-400 mt-4 break-all">{address}</p>

        <button
          onClick={onClose}
          className="w-full mt-4 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold py-2 rounded-full transition-all text-sm"
        >
          Close
        </button>
      </div>
    </div>
  );
}
