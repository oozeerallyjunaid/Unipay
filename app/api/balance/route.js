// app/api/balance/route.js
// Fetches the current XRP balance for any wallet address.
// Called by the frontend whenever it needs to refresh balances.
//
// Usage: GET /api/balance?address=rABC123...

import { NextResponse } from "next/server";
import * as xrpl from "xrpl";

// The XRPL Testnet WebSocket URL — all our API routes use this
const XRPL_WS = "wss://s.altnet.rippletest.net:51233";

export async function GET(request) {
  // Parse the wallet address from the URL query string
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "Missing 'address' query parameter" }, { status: 400 });
  }

  // Connect to the XRPL Testnet
  const client = new xrpl.Client(XRPL_WS);
  try {
    await client.connect();

    // getXrpBalance() is a helper that returns balance as a string in XRP (not drops)
    // e.g. "985.23" rather than "985230000"
    const balance = await client.getXrpBalance(address);

    return NextResponse.json({ balance });
  } catch (err) {
    // Account might not be funded yet
    if (err.message.includes("actNotFound") || err.message.includes("Account not found")) {
      return NextResponse.json({ balance: "0.00" });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    // Always disconnect after we're done — important to avoid connection leaks
    await client.disconnect();
  }
}
