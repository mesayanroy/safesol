# 🚀 DEPLOYMENT CHECKLIST

Pre-flight checklist for deploying your ZK private payment dApp.

---

## ✅ **Pre-Deployment**

### Environment Setup

- [ ] Rust installed (`rustc --version`)
- [ ] Solana CLI installed (`solana --version`)
- [ ] Anchor installed (`anchor --version`)
- [ ] Node.js 20+ installed (`node --version`)
- [ ] pnpm installed (`pnpm --version`)

### Wallet Configuration

- [ ] Keypair generated (`~/.config/solana/id.json` exists)
- [ ] Cluster set to devnet (`solana config get`)
- [ ] Sufficient balance (2+ SOL for deployment)
  ```bash
  solana balance
  # If < 2 SOL: solana airdrop 2
  ```

### Repository Setup

- [ ] All dependencies installed (`pnpm install`)
- [ ] Frontend deps installed (`cd apps/web && pnpm install`)
- [ ] No build errors (`anchor build`)

---

## 🏗️ **Deployment Steps**

### Step 1: Build Programs

```bash
anchor build
```

**Verify:**
- [ ] `target/deploy/privacy_pay.so` exists
- [ ] `target/deploy/zk_verifier.so` exists
- [ ] `target/idl/privacy_pay.json` exists
- [ ] No compilation errors

### Step 2: Deploy to Devnet

```bash
pnpm run deploy
```

**Verify:**
- [ ] Programs deployed successfully
- [ ] Program IDs printed to console
- [ ] `apps/web/.env.local` created with IDs

**Expected output:**
```
✓ Programs deployed:
  Privacy Pay: <PROGRAM_ID>
  ZK Verifier: <VERIFIER_ID>
✓ Program IDs saved to apps/web/.env.local
```

### Step 3: Initialize State

```bash
pnpm run init-state
```

**Verify:**
- [ ] State PDA created
- [ ] Genesis Merkle root set
- [ ] Transaction confirmed

**Expected output:**
```
✅ State initialized!
Authority: <YOUR_PUBKEY>
Merkle root: 000000000000...
Total commitments: 0
```

### Step 4: Run Tests

```bash
anchor test
```

**Verify:**
- [ ] All tests pass
- [ ] No runtime errors
- [ ] Gas costs within limits

### Step 5: Start Frontend

```bash
pnpm run dev:web
```

**Verify:**
- [ ] Runs on `http://localhost:3000`
- [ ] No console errors
- [ ] Wallet adapter loads correctly

---

## 🧪 **Testing Checklist**

### Manual Tests

- [ ] **Connect Wallet**
  - Click "Connect Wallet"
  - Phantom/Solflare popup appears
  - Connection succeeds

- [ ] **Send Payment**
  - Enter valid recipient address
  - Enter amount (e.g., 0.1 SOL)
  - Click "Send Private Payment"
  - Transaction confirms
  - Explorer link works

- [ ] **Verify Privacy**
  - Check explorer (https://explorer.solana.com)
  - Only tx hash visible
  - Amount NOT visible on-chain
  - Recipient encrypted

- [ ] **Check Nullifier**
  - Transaction creates nullifier PDA
  - Second spend with same nullifier fails
  - Prevents double-spending

### Automated Tests

```bash
# Run test suite
anchor test

# Expected:
# ✓ Initializes state
# ✓ Executes private payment
# 2 passing (2s)
```

---

## 📊 **Post-Deployment**

### Verify On-Chain

```bash
# Check program deployed
solana program show <PROGRAM_ID>

# Should show:
# Program Id: <PROGRAM_ID>
# Owner: BPFLoaderUpgradeab1e...
# Data Length: ~X KB
```

### Check State

```bash
# Get state PDA address
solana address --seed state --program-id <PROGRAM_ID>

# Check account
solana account <STATE_PDA>
```

### Monitor Logs

```bash
# Watch program logs
solana logs | grep "privacy_pay"

# Should show:
# Program log: State initialized with root: ...
# Program log: Private payment executed: X lamports
```

---

## 🎬 **Demo Checklist**

### Preparation

- [ ] Frontend running at localhost:3000
- [ ] Phantom wallet installed with testnet SOL
- [ ] Screen recording software ready
- [ ] Script prepared

### Demo Script (2-3 minutes)

**Intro (15s):**
- "Hi, I'm showing ZK private payments on Solana"
- "Privacy-first, not a mixer, compliance-aware"

**Setup (15s):**
- Show frontend UI
- Connect Phantom wallet
- "Notice the privacy guarantees listed"

**Payment Flow (60s):**
- Enter recipient address
- Enter amount (0.1 SOL)
- Click "Send Private Payment"
- Show "Generating ZK proof" loader
- Transaction confirms
- Show transaction receipt

**Privacy Proof (45s):**
- Click "View on Explorer"
- Show Solana Explorer
- Point out: "Only tx hash visible"
- "Amount is NOT visible on-chain"
- "Recipient is encrypted"
- "Nullifier prevents double-spend"

**Architecture (30s):**
- Show code structure briefly
- Explain: ZK circuits → Solana program → Light Protocol
- "Production-ready monorepo structure"

**Wrap (15s):**
- "Deployed to devnet, ready to scale"
- "Code available on GitHub"
- "Thanks!"

### Recording Checklist

- [ ] 1080p or higher resolution
- [ ] Clear audio
- [ ] Browser zoom at 100%
- [ ] Close unnecessary tabs
- [ ] Hide sensitive info (wallet balance, etc.)

---

## 🐛 **Troubleshooting**

### Build Fails

```bash
# Clean and rebuild
anchor clean
rm -rf target
anchor build
```

### Deployment Fails

**Error: "Insufficient funds"**
```bash
solana airdrop 2
# Or use faucet: https://faucet.solana.com
```

**Error: "Program deploy failed"**
```bash
# Check cluster
solana config get
# Should show: RPC URL: https://api.devnet.solana.com

# If wrong:
solana config set --url devnet
```

### State Initialization Fails

**Error: "Account already exists"**
```
State already initialized - this is OK!
Just proceed to next step.
```

**Error: "PDA not found"**
```bash
# Redeploy programs
pnpm run deploy
pnpm run init-state
```

### Frontend Issues

**Error: "Cannot connect to wallet"**
```bash
# Check .env.local exists
cat apps/web/.env.local

# Should contain:
# NEXT_PUBLIC_PROGRAM_ID=...
# NEXT_PUBLIC_VERIFIER_ID=...
```

**Error: "Transaction failed"**
```bash
# Check wallet has SOL
# Check program is deployed
solana program show <PROGRAM_ID>
```

---

## 🏆 **Success Criteria**

You're ready to demo when:

✅ Programs deployed to devnet  
✅ State initialized successfully  
✅ Frontend connects to wallet  
✅ Can send private payment  
✅ Transaction confirms on-chain  
✅ Explorer shows only tx hash  
✅ Nullifier prevents double-spend  
✅ No console errors  
✅ Demo video recorded  

---

## 📋 **Final Checklist**

Before submitting:

- [ ] Code on GitHub (public repo)
- [ ] README.md complete with screenshots
- [ ] Demo video uploaded (YouTube/Loom)
- [ ] Live demo link (Vercel/Netlify)
- [ ] Architecture diagram included
- [ ] Known limitations documented
- [ ] Future roadmap outlined
- [ ] License file included (MIT)

---

## 🎯 **Judge Talking Points**

When presenting, emphasize:

1. **Privacy First**: Not a mixer, privacy-preserving payments
2. **ZK Innovation**: Custom Circom circuits, selective disclosure
3. **Solana Native**: Anchor programs, Light Protocol integration
4. **Production Ready**: Clean architecture, testing, deployment scripts
5. **Compliance Aware**: Selective disclosure for regulatory requirements

---

**You're cleared for launch. Ship it!** 🚀
