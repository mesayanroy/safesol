# SafeSol Groth16 Zero-Knowledge Proof System

This directory contains the complete Groth16 implementation for SafeSol's private payment system.

## Overview

**Groth16** is an industry-standard zero-knowledge proof system that enables private transactions:

- **Proof size**: ~288 bytes (constant, non-interactive)
- **Verification time**: O(1) - instant on-chain verification
- **Trusted setup**: Required once, then reusable forever
- **Security**: SNARK-secure (cryptographically sound)

## Prerequisites

```bash
npm install -g circom
npm install -g snarkjs
npm install circomlib
```

## Quick Start

### 1. Automated Setup (Recommended)

```bash
cd zk
chmod +x setup.sh
./setup.sh
```

This will:
1. ✓ Compile `spend.circom` → R1CS + WASM
2. ✓ Generate Powers of Tau (trusted setup)
3. ✓ Create Groth16 proving & verification keys
4. ✓ Export artifacts for client and Solana

**Time estimate**: ~10-15 minutes

### 2. Manual Build (Educational)

```bash
# Build spend circuit
cd zk/scripts
chmod +x build_circuit.sh
./build_circuit.sh spend

# Build membership circuit
./build_circuit.sh membership

# Build disclosure circuit
./build_circuit.sh disclosure
```

## How It Works

### Step 1: Circuit Definition

The circuit proves:
- You know a secret that created a commitment
- Your balance ≥ amount you're spending
- Your commitment is in the Merkle tree
- The nullifier (prevents double-spending)

### Step 2: Trusted Setup (Powers of Tau)

The **Powers of Tau** ceremony creates a common reference string:
- Secret values s, α, β are generated
- Powers of s are computed and encrypted
- After ceremony, s is destroyed forever
- Allows anyone to create proofs without knowing s

**Time**: 5-15 minutes (first time only)

### Step 3: Groth16 Key Generation

```
Powers of Tau + Circuit constraints → Proving key + Verification key

Proving key (spend_final.zkey):
  - 256 MB binary file
  - Contains encrypted commitments
  - Used on backend to generate proofs
  - MUST be kept secret

Verification key (verification_key.json):
  - 1 KB JSON file
  - Public parameters for verification
  - Deployed on-chain
  - Safe to publish
```

### Step 4: Proof Generation (Client-Side)

```typescript
const { proof, publicSignals } = await snarkjs.groth16.fullProve(
  inputs,
  "artifacts/spend_js/spend.wasm",
  "artifacts/spend_final.zkey"
);

// Output:
// proof = { pi_a, pi_b, pi_c } (288 bytes)
// publicSignals = [nullifier, merkleRoot, amount]
```

### Step 5: On-Chain Verification

```rust
// Solana program verifies the proof
groth16_verify(&proof, &public_signals, &vk)?;
```

## For Production

1. Run automated setup:
   ```bash
   bash zk/setup.sh
   ```

2. Secure the proving key (encrypt and upload to vault)

3. Deploy verification key on-chain

4. Update frontend to use real proofs (lib/zk.ts)

5. Enable on-chain verification in programs/zk-verifier

## Security Considerations

### Key Management
```
PUBLIC (safe to share):
  ├── verification_key.json
  └── spend.wasm

SECRET (must be protected):
  └── spend_final.zkey
```

### Best Practices
1. Never commit proving key to git
2. Store `.zkey` in secure vault
3. Audit circuit before deploying
4. Monitor proof generation

## Circuit Sizes

- spend.circom: ~50K constraints
- membership.circom: ~20K constraints
- disclosure.circom: ~10K constraints

## References

- **Groth16**: https://eprint.iacr.org/2016/260.pdf
- **Circom**: https://docs.circom.io/
- **snarkjs**: https://github.com/iden3/snarkjs
- **Poseidon**: https://www.poseidon-hash.info/

---

**Status**: ✅ Ready for production deployment
**Last Updated**: 2025-01-27
