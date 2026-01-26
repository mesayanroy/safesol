# ⚡ QUICKSTART: 0 to Demo in 30 Minutes

This guide gets your ZK private payment dApp running **FAST**.

---

## 🎯 **Goal**

Get a working demo on Solana devnet in 30 minutes.

---

## ✅ **Prerequisites (10 min)**

### 1. Install Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### 2. Install Solana CLI

```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
```

### 3. Install Anchor

```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

### 4. Install Node.js

```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

### 5. Install pnpm

```bash
npm install -g pnpm
```

**Verify everything:**

```bash
rustc --version   # Should show 1.70+
solana --version  # Should show 1.17+
anchor --version  # Should show 0.29+
node --version    # Should show 20+
pnpm --version    # Should show 8+
```

---

## 🚀 **Setup (5 min)**

### 1. Install Dependencies

```bash
# Root dependencies
pnpm install

# Frontend dependencies
cd apps/web
pnpm install
cd ../..
```

### 2. Setup Solana Wallet

```bash
# Generate new keypair
solana-keygen new --outfile ~/.config/solana/id.json

# Set to devnet
solana config set --url devnet

# Request airdrop (may take 30-60 seconds)
solana airdrop 2

# Verify balance
solana balance  # Should show 2 SOL
```

**If airdrop fails:**

```bash
# Try multiple times
solana airdrop 1 && solana airdrop 1

# Or use the faucet: https://faucet.solana.com
```

---

## 🏗️ **Build & Deploy (10 min)**

### 1. Build Programs

```bash
anchor build
```

**Expected output:**

```
📦 Building programs/privacy-pay...
📦 Building programs/zk-verifier...
✅ Build complete
```

**If build fails:**

```bash
anchor clean
rm -rf target
anchor build
```

### 2. Deploy to Devnet

```bash
pnpm run deploy
```

**This will:**

- Deploy `privacy-pay` program
- Deploy `zk-verifier` program
- Save program IDs to `apps/web/.env.local`

**Expected output:**

```
✓ Programs deployed:
  Privacy Pay: HackDemo1111...
  ZK Verifier: Verifier1111...
✓ Program IDs saved to apps/web/.env.local
```

### 3. Initialize State

```bash
pnpm run init-state
```

**Expected output:**

```
✅ State initialized!
Authority: YourPublicKey...
Merkle root: 000000000000...
Total commitments: 0
```

---

## 🎬 **Run Demo (5 min)**

### Option 1: Frontend Demo

```bash
pnpm run dev:web
```

**Then:**

1. Open [http://localhost:3000](http://localhost:3000)
2. Click "Connect Wallet"
3. Enter recipient address
4. Enter amount (e.g., 0.1 SOL)
5. Click "Send Private Payment"
6. View transaction on Solana Explorer

### Option 2: CLI Demo

```bash
pnpm run demo
```

**Expected output:**

```
🎬 ZK Private Payment Demo
==================================================

👤 Participants:
  Payer: YourPublicKey...
  Recipient: RandomPublicKey...

📊 Current State:
  Merkle root: 000000000000...
  Total commitments: 0

🔐 Generating ZK Proof...
  Amount: 0.1 SOL (HIDDEN on-chain)
  Using MOCK proof for demo

📝 Submitting private payment...

✅ Transaction confirmed!
  Signature: 5Xzy...
  Explorer: https://explorer.solana.com/tx/5Xzy...?cluster=devnet

💰 Recipient Balance: 0.1 SOL

🔒 Nullifier created:
  Hash: a3f2...
  Used at: 2026-01-26T...

🎯 Privacy Properties:
  ✓ Amount is HIDDEN (only ZK proof reveals validity)
  ✓ Recipient is ENCRYPTED (only tx participants know)
  ✓ Nullifier prevents double-spending
  ✓ Explorer shows only: tx hash + root update

🏆 Demo complete! Private payment succeeded.
```

---

## 🧪 **Test (Optional)**

```bash
anchor test
```

**Expected:**

```
  privacy-pay
    ✓ Initializes state (500ms)
    ✓ Executes private payment (1200ms)

  2 passing (2s)
```

---

## 🎉 **Success!**

You now have:

✅ **Solana programs deployed** to devnet  
✅ **State initialized** with genesis root  
✅ **Frontend running** at localhost:3000  
✅ **Demo working** with mock ZK proofs  

---

## 🔥 **Next Steps**

### For Hackathon Demo:

1. **Record video** (use demo flow above)
2. **Customize UI** (already styled with Tailwind)
3. **Add features** (transaction history, selective disclosure)

### For Production:

1. **Build real ZK circuits:**

   ```bash
   # Install circom (if not installed)
   npm install -g circom snarkjs
   
   # Build spend circuit (takes 10-30 min)
   cd zk/scripts
   chmod +x build_circuit.sh
   ./build_circuit.sh spend
   ```

2. **Enable real proofs:**

   Edit `apps/web/lib/zk.ts`:

   ```typescript
   const useMock = false; // Change to false
   ```

3. **Replace verifier:**

   Implement Groth16 verification in `programs/zk-verifier/src/lib.rs`

4. **Integrate Light Protocol:**

   ```bash
   cd apps/web
   pnpm add @lightprotocol/stateless.js
   ```

   Update `apps/web/lib/light.ts` to use real SDK

---

## 🐛 **Troubleshooting**

### "Insufficient balance"

```bash
solana airdrop 2
# Or use: https://faucet.solana.com
```

### "Program not deployed"

```bash
anchor build
anchor deploy --provider.cluster devnet
```

### "State not initialized"

```bash
pnpm run init-state
```

### "Frontend can't connect"

Check `apps/web/.env.local` exists with:

```
NEXT_PUBLIC_PROGRAM_ID=...
NEXT_PUBLIC_VERIFIER_ID=...
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
```

### "Build fails"

```bash
anchor clean
rm -rf target node_modules apps/web/.next
pnpm install
cd apps/web && pnpm install && cd ../..
anchor build
```

---

## 📚 **Useful Commands**

```bash
# View program logs
solana logs | grep "privacy_pay"

# Check program info
solana program show <PROGRAM_ID>

# Get account info
solana account <ACCOUNT_ADDRESS>

# View transaction
solana confirm <SIGNATURE>

# Clean & rebuild
anchor clean && anchor build

# Run specific test
anchor test --skip-deploy
```

---

## 🎯 **You're Ready!**

Your ZK private payment system is **live on Solana devnet**.

Ship it. 🚀

---

**Questions?** Check the [main README](../README.md) or open an issue.
