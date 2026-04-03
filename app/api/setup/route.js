// app/api/setup/route.js
// ONE-TIME SETUP ROUTE — Visit this in your browser ONCE to generate two funded testnet wallets.
// After you get the output, copy the seeds into .env.local and never call this route again.
//
// The XRPL Testnet Faucet gives each new wallet 1000 XRP to play with (test XRP, not real).
//
// Visit: http://localhost:3000/api/setup

import { NextResponse } from "next/server";

// The official Ripple Testnet faucet API endpoint
const FAUCET_URL = "https://faucet.altnet.rippletest.net/accounts";

// Helper: calls the faucet and returns a funded wallet
async function generateFaucetWallet(label) {
  const res = await fetch(FAUCET_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Faucet request failed for ${label}: HTTP ${res.status}`);
  }

  const data = await res.json();

  // The seed is at the top level of the faucet response (alongside account, not inside it)
  return {
    label,
    address: data.account?.classicAddress || data.account?.address,
    seed: data.seed || data.account?.seed || data.account?.secret,
    balance: data.balance || data.amount,
  };
}

export async function GET() {
  try {
    // Call the faucet twice to create two separate funded wallets
    // We do them sequentially (not parallel) to avoid faucet rate limits
    const student = await generateFaucetWallet("Student (Alice)");

    // Small delay between faucet requests to be polite
    await new Promise((r) => setTimeout(r, 2000));

    const consultant = await generateFaucetWallet("Consultant (Bob)");

    // Return everything the user needs to fill in their .env.local
    return NextResponse.json({
      message: "✅ Two testnet wallets generated! Copy the seeds into your .env.local file.",
      instructions: [
        "1. Open the file .env.local in your project folder",
        "2. Set STUDENT_WALLET_SEED to the student seed below",
        "3. Set CONSULTANT_WALLET_SEED to the consultant seed below",
        "4. Save .env.local and restart the dev server (Ctrl+C, then npm run dev)",
        "5. Do NOT call this route again or you'll get different wallets",
      ],
      envFileContent: [
        `STUDENT_WALLET_SEED=${student.seed}`,
        `CONSULTANT_WALLET_SEED=${consultant.seed}`,
      ].join("\n"),
      wallets: {
        student: {
          address: student.address,
          seed: student.seed,                  // ⚠️ treat this like a password — never share it
          startingBalance: `${student.balance} XRP`,
        },
        consultant: {
          address: consultant.address,
          seed: consultant.seed,
          startingBalance: `${consultant.balance} XRP`,
        },
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err.message,
        tip: "The testnet faucet may be temporarily unavailable. Try again in a few seconds.",
      },
      { status: 500 }
    );
  }
}
