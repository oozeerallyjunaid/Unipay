# UniPay XRPL 🌍✕

**Cross-Border Student Payment & Escrow Platform**
Built for the Ripple XRPL Hackathon · Powered by XRP Ledger Testnet

---

## What This Does

UniPay XRPL demonstrates how students in developing countries (Alice, in Mauritius)
can pay international education consultants (Bob, in London) using XRP — instantly,
cheaply, and with smart-contract escrow protection built into the blockchain itself.

**Two payment modes:**
1. **Direct Payment** — Send 10 XRP instantly (settles in ~3 seconds, costs fractions of a cent)
2. **Escrow Payment** — Lock 10 XRP on-chain for 30 seconds; Bob can release it but Alice is protected

---

## First-Time Setup (Do This Once)

### Step 1 — Install Node.js

If you haven't already, download and install Node.js from:
**https://nodejs.org** → click the "LTS" (recommended) button → install it

Verify it worked by opening Terminal and typing:
```
node --version
```
You should see something like `v20.11.0`.

---

### Step 2 — Install project dependencies

Open Terminal, navigate to this folder, and run:
```bash
cd ~/Desktop/unipay-xrpl
npm install
```
This installs Next.js, React, Tailwind CSS, and the xrpl.js library. Takes ~1 minute.

---

### Step 3 — Generate your testnet wallets

Start the development server:
```bash
npm run dev
```

Then open your browser and go to:
```
http://localhost:3000/api/setup
```

You'll see a JSON response with two wallets. Copy the `envFileContent` value — it looks like:
```
STUDENT_WALLET_SEED=sEd...
CONSULTANT_WALLET_SEED=sEd...
```

---

### Step 4 — Create your .env.local file

In the `unipay-xrpl` folder, create a new file called `.env.local`.
Paste the two lines you copied from the setup route:

```
STUDENT_WALLET_SEED=sEd...your_student_seed...
CONSULTANT_WALLET_SEED=sEd...your_consultant_seed...
```

Save the file.

---

### Step 5 — Restart the server and open the app

Press `Ctrl+C` in Terminal to stop the server, then start it again:
```bash
npm run dev
```

Open your browser to:
```
http://localhost:3000
```

You should see the UniPay XRPL interface with Alice and Bob's wallets loaded!

---

## How to Use the Demo

1. **Check balances** — Both wallets start with ~1000 XRP (testnet funds, not real)

2. **Direct Payment** — Click "Send 10 XRP Direct Payment" on Alice's panel.
   Watch Bob's balance increase by 10 XRP in ~3-5 seconds.

3. **Escrow Payment** — Click "Lock 10 XRP in Escrow" on Alice's panel.
   Wait **30 seconds**, then click "Release Escrow & Claim Payment" on Bob's panel.
   Bob receives the XRP only after the time lock expires.

4. **Transaction Log** — Every action appears at the bottom with a clickable TX hash
   that opens the XRPL Testnet Explorer showing the real blockchain transaction.

---

## Project Structure

```
unipay-xrpl/
├── app/
│   ├── layout.js                    # Root HTML wrapper
│   ├── page.js                      # Main page (two-panel layout)
│   ├── globals.css                  # Tailwind CSS imports
│   └── components/
│       └── WalletPanel.js           # Reusable wallet card component
│   └── api/
│       ├── wallet/route.js          # GET  — returns wallet addresses
│       ├── balance/route.js         # GET  — fetches XRP balance
│       ├── pay/route.js             # POST — direct XRP payment
│       ├── escrow/
│       │   ├── create/route.js      # POST — creates time-locked escrow
│       │   └── finish/route.js      # POST — releases escrow to consultant
│       └── setup/route.js           # GET  — one-time wallet generation
├── .env.local                       # Your wallet seeds (never commit this!)
├── .env.local.example               # Template showing what .env.local needs
├── next.config.js                   # Tells Next.js to server-side xrpl.js
├── tailwind.config.js               # Tailwind CSS configuration
└── package.json                     # Project dependencies
```

---

## Technical Details

| Feature | Implementation |
|---|---|
| Blockchain | XRP Ledger Testnet |
| WebSocket | `wss://s.altnet.rippletest.net:51233` |
| Direct Payment | `TransactionType: "Payment"` |
| Escrow Lock | `TransactionType: "EscrowCreate"` with `FinishAfter` |
| Escrow Release | `TransactionType: "EscrowFinish"` |
| Amount Unit | Drops (1 XRP = 1,000,000 drops) |
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| XRPL Library | xrpl.js v3 |

---

## Troubleshooting

**"Wallet seeds not found" error**
→ Make sure `.env.local` exists and has both `STUDENT_WALLET_SEED` and `CONSULTANT_WALLET_SEED`
→ Restart the server after editing `.env.local`

**"EscrowFinish failed: tecNO_TARGET"**
→ The 30-second time lock hasn't expired yet. Wait and try again.

**Balances not updating after a transaction**
→ Click the refresh button on the balance card, or wait 2-3 seconds for the ledger to close.

**Faucet not working during setup**
→ The XRPL testnet faucet is sometimes temporarily unavailable. Wait 30 seconds and try `/api/setup` again.

---

*Built with ❤️ on XRP Ledger · UniPay XRPL · 2024*
