// app/api/pay/route.js
// Handles a direct XRP payment from one wallet to another.
// This is a simple "Payment" transaction on the XRPL — no escrow, no conditions.
//
// Expected POST body: { from: "student", to: "consultant", amount: "10" }

import { NextResponse } from "next/server";
import * as xrpl from "xrpl";

const XRPL_WS = "wss://s.altnet.rippletest.net:51233";

export async function POST(request) {
  // Parse the request body
  const { from, to, amount } = await request.json();

  if (!from || !to || !amount) {
    return NextResponse.json({ error: "Missing required fields: from, to, amount" }, { status: 400 });
  }

  // Load wallet seeds from environment variables based on who is sending
  const senderSeed =
    from === "student"
      ? process.env.STUDENT_WALLET_SEED
      : process.env.CONSULTANT_WALLET_SEED;

  const receiverSeed =
    to === "student"
      ? process.env.STUDENT_WALLET_SEED
      : process.env.CONSULTANT_WALLET_SEED;

  if (!senderSeed || !receiverSeed) {
    return NextResponse.json({ error: "Wallet seeds not configured in .env.local" }, { status: 500 });
  }

  // Build wallet objects from seeds
  const senderWallet = xrpl.Wallet.fromSeed(senderSeed);
  const receiverWallet = xrpl.Wallet.fromSeed(receiverSeed);

  // Connect to XRPL Testnet
  const client = new xrpl.Client(XRPL_WS);
  try {
    await client.connect();

    // Build the Payment transaction object
    // xrpl.xrpToDrops("10") converts 10 XRP → "10000000" drops
    const paymentTx = {
      TransactionType: "Payment",
      Account: senderWallet.address,         // who is sending
      Destination: receiverWallet.address,   // who is receiving
      Amount: xrpl.xrpToDrops(amount),       // amount in drops (smallest XRP unit)
    };

    // autofill() automatically fills in required fields like Fee, Sequence, LastLedgerSequence
    const prepared = await client.autofill(paymentTx);

    // sign() creates a cryptographic signature using the sender's private key
    const signed = senderWallet.sign(prepared);

    // submitAndWait() submits the transaction and waits until it's validated on-ledger
    // This typically takes 3-5 seconds
    const result = await client.submitAndWait(signed.tx_blob);

    // Check if the transaction succeeded
    const txResult = result.result.meta.TransactionResult;
    if (txResult !== "tesSUCCESS") {
      throw new Error(`Transaction failed: ${txResult}`);
    }

    // Fetch the updated balance of the sender after the payment
    const newBalance = await client.getXrpBalance(senderWallet.address);

    return NextResponse.json({
      hash: result.result.hash,      // transaction ID (can be looked up on explorer)
      result: txResult,
      senderNewBalance: newBalance,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    await client.disconnect();
  }
}
