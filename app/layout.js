// layout.js — Root wrapper for every page. Adds the NavBar and global styles.

import "./globals.css";
import NavBar from "./components/NavBar";

export const metadata = {
  title: "UniPay XRPL — Cross-Border Student Payments",
  description: "Fast, trustless payments for global education using XRP Ledger. By Unistellar Admissions Consulting.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white min-h-screen">
        {/* NavBar appears at the top of every page */}
        <NavBar />
        {children}
      </body>
    </html>
  );
}
