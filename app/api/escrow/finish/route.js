// app/api/escrow/finish/route.js
// Releases a previously created escrow, sending the locked XRP to the Consultant (Bob).
// Bob submits this transaction after the FinishAfter time has passed.
//
// Expected POST body: { sequence: 12345678 }
//   where `sequence` is the escrow sequence number returned by /api/escrow/create

import { NextResponse } from "next/server";
import * as xrpl from "xrpl";

const XRPL_WS = "wss://s.altnet.rippletest.net:51233";

export async function POST(request) {
  const { sequence } = await request.json();

  if (sequence === undefined || sequence === null) {
    return NextResponse.json({ error: "Missing 'sequence' field" }, { status: 400 });
  }

  const studentSeed = process.env.STUDENT_WALLET_SEED;
  const consultantSeed = process.env.CONSULTANT_WALLET_SEED;

  if (!studentSeed || !consultantSeed) {
    return NextResponse.json({ error: "Wallet seeds not configured in .env.local" }, { status: 500 });
  }

  const studentWallet = xrpl.Wallet.fromSeed(studentSeed);
  const consultantWallet = xrpl.Wallet.fromSeed(consultantSeed);

  const client = new xrpl.Client(XRPL_WS);
  try {
    await client.connect();

    // Build the EscrowFinish transaction
    // This must be submitted by the Destination (Bob/Consultant)
    const escrowFinishTx = {
      TransactionType: "EscrowFinish",
      Account: consultantWallet.address, // Bob is submitting this
      Owner: studentWallet.address,      // Alice originally created the escrow
      OfferSequence: sequence,           // Points to the specific escrow to release
      // Note: If the escrow had a Condition (crypto-condition), we'd need to supply
      // Fulfillment here too. Since we're using time-only, we don't need it.
    };

    const prepared = await client.autofill(escrowFinishTx);
    const signed = consultantWallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);

    const txResult = result.result.meta.TransactionResult;
    if (txResult !== "tesSUCCESS") {
      throw new Error(`EscrowFinish failed: ${txResult}. If the escrow was just created, wait 30 seconds and try again.`);
    }

    // Fetch updated balances for both wallets to confirm the transfer
    const [studentBalance, consultantBalance] = await Promise.all([
      client.getXrpBalance(studentWallet.address),
      client.getXrpBalance(consultantWallet.address),
    ]);

    return NextResponse.json({
      hash: result.result.hash,
      studentBalance,
      consultantBalance,
      message: "Escrow released! Bob has received the XRP.",
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    await client.disconnect();
  }
}
