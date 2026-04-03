// app/api/wallet/route.js
// This API route is called when the page loads.
// It reads wallet SEEDS from environment variables (.env.local),
// derives the wallet ADDRESSES from those seeds,
// and returns ONLY the addresses to the browser — never the seeds.
//
// Why? Seeds are like private keys / passwords. We must never expose them to the browser.

import { NextResponse } from "next/server";
import * as xrpl from "xrpl";

export async function GET() {
  try {
    // Read the secret seeds from environment variables
    const studentSeed = process.env.STUDENT_WALLET_SEED;
    const consultantSeed = process.env.CONSULTANT_WALLET_SEED;

    // If either seed is missing, return an error with a helpful message
    if (!studentSeed || !consultantSeed) {
      return NextResponse.json(
        {
          error:
            "Wallet seeds not found. Please visit /api/setup to generate wallets, " +
            "then add STUDENT_WALLET_SEED and CONSULTANT_WALLET_SEED to your .env.local file.",
        },
        { status: 500 }
      );
    }

    // Use xrpl.js to derive wallet objects from seeds.
    // Wallet.fromSeed() gives us the wallet address without connecting to the network.
    const studentWallet = xrpl.Wallet.fromSeed(studentSeed);
    const consultantWallet = xrpl.Wallet.fromSeed(consultantSeed);

    // Return only the public addresses — never the seeds or private keys
    return NextResponse.json({
      studentAddress: studentWallet.address,
      consultantAddress: consultantWallet.address,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
