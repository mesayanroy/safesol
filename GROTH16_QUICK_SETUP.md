# Quick Groth16 Setup Checklist

Complete this checklist to set up real zero-knowledge proofs for SafeSol.

## Pre-Setup (5 minutes)

- [ ] **Install circom**
  ```bash
  npm install -g circom
  circom --version  # Should be 2.1.6+
  ```

- [ ] **Install snarkjs**
  ```bash
  npm install -g snarkjs
  snarkjs --version  # Should be 0.5.0+
  ```

- [ ] **Verify Node.js version**
  ```bash
  node --version  # Should be 18+
  ```

- [ ] **Check disk space**
  ```bash
  df -h /home/sayan/solana-dapp/app/safesol/
  # Need: ~4 GB free (for Powers of Tau + keys)
  ```

## Run Setup (15-20 minutes)

- [ ] **Navigate to zk directory**
  ```bash
  cd /home/sayan/solana-dapp/app/safesol/zk
  ```

- [ ] **Make setup script executable**
  ```bash
  chmod +x setup.sh
  ```

- [ ] **Run the setup**
  ```bash
  ./setup.sh
  ```
  
  ⏱️ **Timing:**
  - Compilation: 1-2 minutes
  - Powers of Tau: 5-10 minutes (be patient!)
  - Groth16 Keys: 3-5 minutes
  - Total: 10-20 minutes

- [ ] **Watch for success message**
  ```
  === Groth16 Setup Complete ===
  Artifacts created in: .../zk/artifacts/
  ```

## Verify Artifacts (2 minutes)

- [ ] **Check all files exist**
  ```bash
  cd zk/artifacts
  ls -lh
  ```

  Should see:
  - ✓ `spend.r1cs` (~5 MB)
  - ✓ `spend_js/spend.wasm` (~15 MB)
  - ✓ `spend_final.zkey` (~256 MB) ⚠️ KEEP SECRET!
  - ✓ `verification_key.json` (~1 KB)
  - ✓ `pot14_final.ptau` (~3.7 GB)

- [ ] **Verify file sizes are reasonable**
  ```bash
  # spend.wasm should be 10-20 MB
  ls -lh spend_js/spend.wasm
  
  # spend_final.zkey should be 200-300 MB
  ls -lh spend_final.zkey
  ```

## Integrate with Frontend (5 minutes)

- [ ] **Copy WASM to frontend**
  ```bash
  cp zk/artifacts/spend_js/spend.wasm apps/web/public/circuits/
  ```

- [ ] **Copy verification key to frontend**
  ```bash
  cp zk/artifacts/verification_key.json apps/web/public/circuits/
  ```

- [ ] **Verify files in public folder**
  ```bash
  ls -la apps/web/public/circuits/
  # Should show:
  # - spend.wasm (15 MB)
  # - verification_key.json (1 KB)
  ```

- [ ] **Enable real proofs in .env.local**
  ```bash
  # Edit apps/web/.env.local
  NEXT_PUBLIC_ENABLE_MOCK_PROOFS=false
  ```

## Test Locally (10 minutes)

- [ ] **Start frontend**
  ```bash
  cd apps/web
  pnpm dev
  ```

- [ ] **Open browser**
  ```
  http://localhost:3000
  ```

- [ ] **Test proof generation**
  1. Click "Make Private Payment"
  2. Enter test data (amount, recipient)
  3. Watch browser console for:
     ```
     [ZK] Generating proof with inputs: ...
     [ZK] ✓ Proof generated successfully
     ```
  4. Should take 5-30 seconds depending on machine

- [ ] **Check proof size**
  - Proof should be exactly 288 bytes
  - Public signals should be [nullifier, merkleRoot, amount]

## Secure the Keys (5 minutes)

- [ ] **Protect proving key**
  ```bash
  # Move to secure location
  mv zk/artifacts/spend_final.zkey ~/.safesol/spend_final.zkey
  chmod 600 ~/.safesol/spend_final.zkey
  ```

- [ ] **Add to .gitignore**
  ```bash
  echo "zk/artifacts/spend_final.zkey" >> .gitignore
  echo "zk/artifacts/*.ptau" >> .gitignore
  ```

- [ ] **Verify not in git**
  ```bash
  git status
  # Should not show spend_final.zkey
  ```

- [ ] **Backup verification key** (safe to share)
  ```bash
  cp zk/artifacts/verification_key.json verification_key.backup.json
  ```

## Production Setup (Optional)

- [ ] **Create encrypted backup**
  ```bash
  openssl enc -aes-256-cbc -in ~/.safesol/spend_final.zkey -out spend_final.zkey.enc
  # Enter password when prompted
  ```

- [ ] **Store in secure vault**
  - AWS KMS, HashiCorp Vault, or similar
  - Document access procedure
  - Set up audit logging

- [ ] **Document ceremony**
  - Record date/time of setup
  - Save this checklist with completion time
  - Create rotation schedule (e.g., yearly)

## Troubleshooting

### Setup Hangs at "Powers of Tau"

```bash
# This is normal! Takes 5-15 minutes.
# Monitor progress:
top
# Should show circom or snarkjs using CPU

# If it truly hangs (no CPU usage for 5+ min):
pkill -f snarkjs
# And re-run ./setup.sh
```

### "Cannot find circom/snarkjs"

```bash
# Install globally
npm install -g circom snarkjs

# Add to PATH if needed
export PATH="$HOME/.npm/_npx:$PATH"
```

### Proof Generation Fails in Browser

```bash
# Check WASM is loaded
curl -I http://localhost:3000/circuits/spend.wasm
# Should return 200 OK

# Check browser console for actual error
# Look for [ZK] error messages
```

### Files Not Found After Setup

```bash
# Verify setup completed successfully
cat zk/artifacts/spend_final.zkey | wc -c
# Should show size like 268435456 (256 MB)

# If files missing, re-run setup
cd zk
rm -rf artifacts/*
./setup.sh
```

## Final Verification

- [ ] **All artifacts created** ✓
- [ ] **Frontend files copied** ✓
- [ ] **Real proofs enabled** ✓
- [ ] **Local test successful** ✓
- [ ] **Proving key secured** ✓
- [ ] **Verification key backed up** ✓

## Success! 🎉

You now have:
- ✓ Real Groth16 proving/verification keys
- ✓ Production-ready circuit (20-level Merkle tree)
- ✓ Frontend proof generation (288-byte proofs)
- ✓ Verification key for on-chain verification

**Next steps:**
1. Deploy Solana verifier program to use `verification_key.json`
2. Test on-chain proof verification
3. Deploy to mainnet when ready

---

**Estimated Total Time:** 30-40 minutes
**Last Updated:** 2025-01-27
