// app/api/escrow/create/route.js
// Creates a time-locked escrow on the XRP Ledger.
//
// Time windows (demo):
//   FinishAfter  = now + 10 min  → Consultant can release after this
//   CancelAfter  = now + 48 h   → Student can dispute/cancel after this

import { NextResponse } from "next/server";
import * as xrpl from "xrpl";

const XRPL_WS = "wss://s.altnet.rippletest.net:51233";
const RIPPLE_EPOCH_OFFSET = 946684800; // Jan 1 2000 in Unix time

export async function POST(request) {
  const { amount, finishAfterSeconds, cancelAfterSeconds } = await request.json();

  if (!amount) {
    return NextResponse.json({ error: "Missing 'amount' field" }, { status: 400 });
  }

  const finishSecs = parseInt(finishAfterSeconds, 10) || 600;    // default 10 min
  const cancelSecs = parseInt(cancelAfterSeconds, 10) || 172800; // default 48 h

  if (cancelSecs <= finishSecs) {
    return NextResponse.json({ error: "cancelAfterSeconds must be greater than finishAfterSeconds" }, { status: 400 });
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

    const nowRipple = Math.floor(Date.now() / 1000) - RIPPLE_EPOCH_OFFSET;

    const escrowCreateTx = {
      TransactionType: "EscrowCreate",
      Account: studentWallet.address,
      Destination: consultantWallet.address,
      Amount: xrpl.xrpToDrops(amount),
      FinishAfter: nowRipple + finishSecs,
      CancelAfter: nowRipple + cancelSecs,
    };

    const prepared = await client.autofill(escrowCreateTx);
    const signed = studentWallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);

    const txResult = result.result.meta.TransactionResult;
    if (txResult !== "tesSUCCESS") {
      throw new Error(`EscrowCreate failed: ${txResult}`);
    }

    // Get the sequence number — try multiple response paths for compatibility
    const escrowSequence =
      result.result.tx_json?.Sequence ??
      result.result.Sequence ??
      prepared.Sequence;

    return NextResponse.json({
      hash: result.result.hash,
      sequence: escrowSequence,
      finishAfter: nowRipple + finishSecs,
      cancelAfter: nowRipple + cancelSecs,
      message: `Escrow created. Release window: ${finishSecs}s. Dispute window: ${cancelSecs}s.`,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    await client.disconnect();
  }
}
