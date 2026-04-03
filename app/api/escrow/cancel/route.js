// app/api/escrow/cancel/route.js
// Cancels an escrow and returns the locked XRP to the student (Alice).
// This is the "dispute" feature — only works after the CancelAfter time has passed.
//
// In our demo: FinishAfter = +30s, CancelAfter = +90s
// So between 30s and 90s: Bob can release. After 90s: Alice can cancel/dispute.
//
// Expected POST body: { sequence: number }

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
    return NextResponse.json({ error: "Wallet seeds not configured" }, { status: 500 });
  }

  const studentWallet = xrpl.Wallet.fromSeed(studentSeed);

  const client = new xrpl.Client(XRPL_WS);
  try {
    await client.connect();

    // EscrowCancel returns the locked XRP to the original sender (Alice)
    // This only succeeds after the CancelAfter time has passed
    const escrowCancelTx = {
      TransactionType: "EscrowCancel",
      Account: studentWallet.address, // Alice submits and receives the refund
      Owner: studentWallet.address,   // Alice was the owner who created the escrow
      OfferSequence: sequence,
    };

    const prepared = await client.autofill(escrowCancelTx);
    const signed = studentWallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);

    const txResult = result.result.meta.TransactionResult;
    if (txResult !== "tesSUCCESS") {
      throw new Error(
        `EscrowCancel failed: ${txResult}. The dispute window (90s) may not have opened yet. ` +
        `If Bob already released the escrow, it no longer exists.`
      );
    }

    // Fetch Alice's updated balance after refund
    const studentBalance = await client.getXrpBalance(studentWallet.address);

    return NextResponse.json({
      hash: result.result.hash,
      studentBalance,
      message: "Escrow cancelled. XRP refunded to Alice.",
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    await client.disconnect();
  }
}
