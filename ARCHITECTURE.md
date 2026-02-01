# 🏗️ ARCHITECTURE OVERVIEW

Complete technical architecture of the ZK Private Payment system.

---

## 📊 **System Architecture**

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Next.js Frontend (apps/web)                                 │   │
│  │  - Wallet Adapter (Phantom, Solflare)                       │   │
│  │  - ZK Proof Generator (lib/zk.ts)                           │   │
│  │  - Transaction Builder (lib/solana.ts)                      │   │
│  │  - Light Protocol Client (lib/light.ts)                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        SOLANA BLOCKCHAIN                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Privacy Pay Program (programs/privacy-pay)                 │   │
│  │  ┌─────────────────────────────────────────────────────┐   │   │
│  │  │  Instructions:                                       │   │   │
│  │  │  - initialize (setup state PDA)                     │   │   │
│  │  │  - private_spend (verify proof, create nullifier)   │   │   │
│  │  │  - add_commitment (add to Merkle tree)              │   │   │
│  │  └─────────────────────────────────────────────────────┘   │   │
│  │  ┌─────────────────────────────────────────────────────┐   │   │
│  │  │  State:                                              │   │   │
│  │  │  - State (Merkle root, commitment count)            │   │   │
│  │  │  - Nullifier (prevents double-spend)                │   │   │
│  │  └─────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  ZK Verifier Program (programs/zk-verifier)                 │   │
│  │  - verify_proof (Groth16 verification)                      │   │
│  │  - [MOCK in hackathon mode]                                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Light Protocol (compression layer)                         │   │
│  │  - Compressed Merkle trees                                  │   │
│  │  - Account compression                                      │   │
│  │  - Proof generation                                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         ZK CIRCUIT LAYER                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Circom Circuits (zk/circuits)                              │   │
│  │  - spend.circom (private payment proof)                     │   │
│  │  - membership.circom (Merkle tree membership)               │   │
│  │  - disclosure.circom (selective disclosure)                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 **Privacy Flow**

### Step 1: Commitment Creation

```typescript
// User creates commitment
secret = randomBytes(32)
amount = 1 * LAMPORTS_PER_SOL
commitment = poseidon(secret, amount)
```

### Step 2: ZK Proof Generation

```circom
// Circuit proves (without revealing):
1. I know secret for commitment
2. My balance >= amount
3. Commitment is in Merkle tree
4. Nullifier is correctly derived

// Outputs (public):
- nullifier (prevents double-spend)
- merkleRoot (current state)
- amount (optional: can be hidden with range proof)
```

### Step 3: Transaction Submission

```rust
// Solana program verifies:
1. ZK proof is valid (CPI to verifier)
2. Nullifier doesn't exist (no double-spend)
3. Merkle root matches current state

// Then:
- Creates nullifier PDA
- Updates Merkle root
- Transfers SOL to recipient
```

### Step 4: State Update

```
Old State:
  Root: 0xabc...
  Commitments: [C1, C2, C3]

New State:
  Root: 0xdef... (updated)
  Commitments: [C1, C2, C3, C4] (new commitment added)
  Nullifiers: [N1] (prevents re-use of C4)
```

---

## 📁 **File Organization**

### Frontend (`apps/web/`)

```
apps/web/
├── app/
│   ├── layout.tsx          # Root layout with wallet provider
│   ├── page.tsx            # Main payment interface
│   └── globals.css         # Tailwind styles
├── components/
│   ├── WalletProvider.tsx  # Solana wallet adapter setup
│   ├── PaymentForm.tsx     # Payment input form
│   └── TransactionHistory.tsx # Privacy-preserving tx view
├── lib/
│   ├── zk.ts              # ZK proof generation
│   │   ├── generateCommitment()
│   │   ├── generateNullifier()
│   │   ├── generateSpendProof()
│   │   └── calculateMerklePath()
│   ├── solana.ts          # Solana interactions
│   │   ├── buildPrivatePaymentTx()
│   │   ├── initializeState()
│   │   ├── getCurrentMerkleRoot()
│   │   └── isNullifierUsed()
│   └── light.ts           # Light Protocol integration
│       ├── storeCompressedCommitment()
│       ├── getCommitmentProof()
│       └── getCurrentRoot()
└── package.json
```

### Solana Programs (`programs/`)

```
programs/
├── privacy-pay/
│   ├── src/
│   │   ├── lib.rs                    # Program entrypoint
│   │   ├── state/
│   │   │   └── mod.rs                # State & Nullifier accounts
│   │   └── instructions/
│   │       ├── initialize.rs         # Setup state PDA
│   │       ├── private_spend.rs      # Execute private payment
│   │       └── add_commitment.rs     # Add to Merkle tree
│   └── Cargo.toml
└── zk-verifier/
    ├── src/
    │   └── lib.rs                    # Groth16 verifier (mocked)
    └── Cargo.toml
```

### ZK Circuits (`zk/`)

```
zk/
├── circuits/
│   ├── spend.circom          # Main payment circuit
│   │   ├── Proves: balance >= amount
│   │   ├── Proves: commitment membership
│   │   ├── Outputs: nullifier, root
│   ├── membership.circom     # Merkle tree membership
│   │   ├── Proves: leaf is in tree
│   │   ├── Without revealing position
│   └── disclosure.circom     # Selective disclosure
│       ├── Proves: balance > threshold
│       ├── For compliance checks
├── scripts/
│   └── build_circuit.sh      # Compile circuit → WASM + zkey
└── build/                    # Output (gitignored)
    └── spend/
        ├── spend.wasm
        ├── spend_final.zkey
        └── verification_key.json
```

### Scripts (`scripts/`)

```
scripts/
├── deploy.ts           # Deploy programs to devnet
│   ├── Build programs
│   ├── Deploy to cluster
│   ├── Save program IDs
├── init_state.ts       # Initialize state PDA
│   ├── Create genesis Merkle root
│   ├── Setup state account
└── demo_flow.ts        # Full demo workflow
    ├── Generate proof
    ├── Submit transaction
    ├── Verify on-chain
```

---

## 🔑 **Key Concepts**

### PDAs (Program Derived Addresses)

```rust
// State PDA (holds Merkle root)
seeds: ["state"]
→ stores: { merkleRoot, totalCommitments, nextIndex }

// Nullifier PDA (prevents double-spend)
seeds: ["nullifier", nullifier_hash]
→ stores: { hash, usedAt, bump }
```

### Commitments

```typescript
// Pedersen/Poseidon commitment
commitment = hash(secret, amount)

// Properties:
- Hiding: Can't derive amount from commitment
- Binding: Can't change amount after commitment
- Used to store value privately on-chain
```

### Nullifiers

```typescript
// Derived from commitment + secret
nullifier = hash(commitment, secret)

// Purpose:
- Proves you spent a commitment
- Can only be derived by commitment owner
- Prevents double-spending (checked on-chain)
```

### Merkle Trees

```
         Root
        /    \
      H01    H23
     /  \   /  \
    C0  C1 C2  C3  ← Commitments

// ZK proof shows:
- I know a commitment Ci
- Ci is in this tree
- Without revealing which leaf (privacy!)
```

---

## 🚀 **Transaction Lifecycle**

```
1. User Action
   ↓ Enter recipient + amount
   
2. Proof Generation (client-side)
   ↓ generateSpendProof()
   ↓ Takes 10-30 seconds (or instant if mocked)
   
3. Build Transaction
   ↓ buildPrivatePaymentTx()
   ↓ Find PDAs, add accounts
   
4. Wallet Sign
   ↓ User approves in Phantom/Solflare
   
5. Submit to Solana
   ↓ sendTransaction()
   
6. Validators Process
   ↓ Execute program instructions
   ↓ Verify proof (CPI to verifier)
   ↓ Check nullifier doesn't exist
   ↓ Update Merkle root
   
7. Confirmation
   ↓ Transaction finalized
   ↓ Explorer shows tx hash only
   ↓ Amount/recipient remain private
```

---

## 🛡️ **Security Properties**

| Property | Mechanism | Implementation |
|----------|-----------|----------------|
| **Confidentiality** | ZK proofs hide amount | `spend.circom` |
| **Integrity** | Merkle tree verification | `membership.circom` |
| **Non-repudiation** | Nullifiers | `Nullifier` PDA |
| **Authenticity** | Signature verification | Wallet adapter |
| **Availability** | Compressed state | Light Protocol |

---

## ⚡ **Performance**

| Operation | Time (Mock) | Time (Real) |
|-----------|-------------|-------------|
| Proof generation | <100ms | 10-30s |
| Transaction submit | ~400ms | ~400ms |
| Confirmation | 1-2s | 1-2s |
| Circuit compilation | N/A | 10-30 min |
| Verifier gas cost | ~10K CU | ~200K CU |

---

## 🎯 **Production Checklist**

Before going to mainnet:

- [ ] Build real ZK circuits (not mocked)
- [ ] Implement Groth16 verifier in Rust
- [ ] Integrate full Light Protocol SDK
- [ ] Add circuit ceremony (trusted setup)
- [ ] Security audit (programs + circuits)
- [ ] Load testing (1000+ TPS)
- [ ] Frontend optimization (proof caching)
- [ ] Error handling & recovery
- [ ] Monitoring & alerting
- [ ] Key management (HSM)

---

## 📚 **Technical Stack**

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 14 | React framework |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **Wallet** | Solana Wallet Adapter | Multi-wallet support |
| **Blockchain** | Solana (Devnet) | Layer 1 |
| **Programs** | Anchor 0.29 | Solana framework |
| **ZK Circuits** | Circom 2.0 | Circuit language |
| **Proof System** | Groth16 | ZK-SNARK protocol |
| **Hashing** | Poseidon | ZK-friendly hash |
| **Compression** | Light Protocol | State compression |
| **Testing** | Mocha + Chai | Test framework |

---


