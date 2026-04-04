// layout.js — Root wrapper for every page. Adds the NavBar and global styles.

import "./globals.css";
import NavBar from "./components/NavBar";

export const metadata = {
  title: "UniPay XRPL — Cross-Border Student Payments | Home",
  description: "Fast, trustless payments for global education using XRP Ledger. By Unistellar Admissions Consulting, Abu Dhabi.",
  icons: {
    // Emoji favicon — works in all modern browsers with no image file needed
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>✕</text></svg>",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 min-h-screen">
        {/* NavBar appears at the top of every page */}
        <NavBar />
        {children}
      </body>
    </html>
  );
}
