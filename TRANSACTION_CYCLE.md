# SafeSol - End-to-End Private Payment Transaction Cycle

## Complete Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER WALLET                               │
│  (Phantom/Solflare - holds secret, knows balance)            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼ 1. CREATE PAYMENT INTENT
┌─────────────────────────────────────────────────────────────┐
│           OFF-CHAIN ZK CIRCUIT GENERATION                    │
│                                                               │
│  Input Preparation:                                          │
│  - secret: User's private key material                       │
│  - amount: Payment amount (in lamports)                      │
│  - balance: User's total balance (from wallet)               │
│  - recipient: Recipient address                              │
│                                                               │
│  Step 1: Generate Commitment                                 │
│  ├─ commitment = poseidon(secret, amount)                   │
│  └─ prevents amount from being visible                       │
│                                                               │
│  Step 2: Merkle Proof Generation                             │
│  ├─ Query Light Protocol for compressed tree                 │
│  ├─ Get proof that commitment exists in tree                │
│  └─ Retrieve merkle_root from current state                  │
│                                                               │
│  Step 3: Balance Proof                                       │
│  ├─ Generate range proof: balance >= amount                 │
│  └─ Verified in circuit, not revealed                        │
│                                                               │
│  Step 4: Nullifier Generation                                │
│  ├─ nullifier = poseidon(commitment, secret)               │
│  └─ prevents double-spending of same commitment              │
│                                                               │
│  Step 5: ZK Proof Generation (Groth16)                       │
│  ├─ Circuit: spend.circom (20-level Merkle tree)            │
│  ├─ Inputs: secret, amount, balance, merkle_proof[]          │
│  ├─ Public signals: [nullifier, merkle_root, amount]         │
│  └─ Output: π (zero-knowledge proof)                         │
└────────────┬───────────────────────────────────────────────┘
             │
             ▼ 2. LOCAL PROOF VALIDATION
        ┌────────────────────────┐
        │ Verify Merkle Proof:   │
        │ - Reconstruct root     │
        │ - Compare with stored  │
        │ - Ensure freshness     │
        └────────┬───────────────┘
                 │
                 ▼ 3. SUBMIT TRANSACTION TO SOLANA
┌──────────────────────────────────────────────────────────────┐
│         SOLANA BLOCKCHAIN - PROGRAM EXECUTION                │
│                                                               │
│  Program: privacy-pay (Anchor)                               │
│  Instruction: private_spend                                  │
│                                                               │
│  Accounts:                                                   │
│  ├─ payer: User wallet (signer)                              │
│  ├─ state: State PDA (stores merkle_root)                   │
│  ├─ nullifier: Nullifier PDA (prevents double-spend)        │
│  ├─ recipient: Receives payment                              │
│  ├─ zk_verifier: Proof verification program                  │
│  └─ system_program: For transfers                            │
│                                                               │
│  Step 1: VERIFY MERKLE ROOT                                  │
│  ├─ Check: state.merkle_root == provided merkle_root        │
│  ├─ Ensures proof matches on-chain state                    │
│  └─ FAIL if mismatch (race condition protection)            │
│                                                               │
│  Step 2: VERIFY ZK PROOF                                     │
│  ├─ CPI call to zk_verifier program                          │
│  ├─ Verifies: π(nullifier, merkle_root, amount)            │
│  ├─ Parses proof: pi_a, pi_b, pi_c (Groth16 format)        │
│  ├─ Checks: e(pi_a, pi_b) ≈ e(α, β) * e(pubin, γ) * ...    │
│  └─ FAIL if proof invalid                                   │
│                                                               │
│  Step 3: VERIFY NULLIFIER FRESHNESS                          │
│  ├─ Check if nullifier PDA exists                            │
│  ├─ If exists: double-spend detected → FAIL                 │
│  └─ Create nullifier PDA (accounts for used nullifier)      │
│                                                               │
│  Step 4: CREATE NULLIFIER PDA                                │
│  ├─ Seeds: [b"nullifier", nullifier_seed]                   │
│  ├─ Stores: nullifier hash + timestamp                      │
│  └─ Future transactions using same nullifier will fail      │
│                                                               │
│  Step 5: UPDATE MERKLE TREE STATE                            │
│  ├─ Compute new_root = poseidon(merkle_root, commitment)    │
│  ├─ Store: state.merkle_root = new_root                     │
│  ├─ Effect: Next payment uses updated root                  │
│  └─ Light Protocol: Updates compressed tree                 │
│                                                               │
│  Step 6: TRANSFER SOL TO RECIPIENT                           │
│  ├─ System instruction: transfer(payer → recipient, amount) │
│  ├─ Amount is hardcoded in circuit (proven but not shown)   │
│  └─ Recipient visible on-chain, amount not                  │
│                                                               │
│  BLOCKCHAIN STATE AFTER:                                     │
│  ├─ nullifier PDA: Created (accounts for usage)             │
│  ├─ state.merkle_root: Updated with new commitment          │
│  ├─ Recipient account: +amount lamports                      │
│  └─ Payer account: -amount lamports                          │
└──────────┬─────────────────────────────────────────────────┘
           │
           ▼ 4. TRANSACTION CONFIRMED
      ┌────────────────────────┐
      │ Validators finalize    │
      │ Update state consensus │
      │ Transaction immutable  │
      └────────┬───────────────┘
               │
               ▼ 5. SOLANA EXPLORER VIEW
         ┌─────────────────────────────┐
         │ Shows:                       │
         │ ✓ Tx Hash (signature)        │
         │ ✓ From/To Addresses          │
         │ ✗ Amount (HIDDEN)            │
         │ ✗ Recipient encryption key   │
         │ ✓ New Merkle Root            │
         │ ✓ Nullifier Hash             │
         └─────────────────────────────┘
```

## Key Privacy Properties

### Amount Privacy
- **Hidden**: Proven in circuit but not shown on-chain
- **Verification**: Zero-knowledge proof validates balance ≥ amount
- **Explorer**: Only shows tx hash, no amount visible

### Recipient Privacy
- **Encryption**: Recipient encrypted with ZK proof
- **On-chain**: Only nullifier visible, not recipient
- **Decryption**: Only user can decrypt using their private key

### Sender Privacy
- **Implicit**: Visible as payer in transaction
- **Anonymity**: Can be improved with Tornado.Cash-style mixing

### Nullifier Security
- **Double-Spend Prevention**: Same nullifier can't be used twice
- **Storage**: Nullifier PDA created on first use
- **Verification**: On-chain check prevents reuse

## Data Structures

### ZK Circuit Inputs (Private)
```rust
struct CircuitInputs {
    secret: [u8; 32],           // User's secret key
    amount: u64,                 // Payment amount
    balance: u64,                // User's available balance
    merkleProof: [[u8; 32]; 20], // Merkle path (20 levels)
    merklePathIndices: [u8; 20], // Binary path (0=left, 1=right)
    recipient: PublicKey,        // Recipient address
}
```

### ZK Circuit Outputs (Public)
```rust
struct PublicSignals {
    nullifier: [u8; 32],   // poseidon(commitment, secret)
    merkleRoot: [u8; 32],  // Current tree root
    amount: u64,           // Proven but hidden
}
```

### Solana Program State
```rust
#[account]
pub struct State {
    pub merkle_root: [u8; 32],  // Current Merkle root
    pub bump: u8,               // PDA bump seed
    pub total_commitments: u64, // Stats
}

#[account]
pub struct Nullifier {
    pub hash: [u8; 32],     // Nullifier hash
    pub used_at: i64,       // Unix timestamp
    pub bump: u8,           // PDA bump seed
}
```

## Light Protocol Integration

### Compressed State Management
```
StandardAccount:
├─ Storage Cost: 890 bytes * rent_rate (expensive)
└─ Root: 1 per program

CompressedMerkleTree (Light Protocol):
├─ Storage Cost: ~0.5 bytes per commitment (cheap)
├─ Root: Updated with each payment
└─ Path: Proves membership efficiently
```

### Flow Integration
1. **Deposit**: User's commitment → Light compressed tree
2. **Payment**: Prove commitment in tree using Merkle proof
3. **Update**: New commitment added to tree after payment
4. **Scalability**: 1000x cheaper than standard accounts

## Security Assumptions

### Circuit Security
- **Circom**: Proven compiler for ZK circuits
- **Poseidon**: Efficient hash for merkle trees
- **Groth16**: Industry-standard proof system

### On-chain Verification
- **CPI**: Cross-program invocation to zk-verifier
- **Anchor**: Safe account serialization
- **BPF**: Solana's optimized runtime

### Cryptographic Assumptions
- **Poseidon**: Collision-resistant
- **Groth16**: Proof cannot be forged (SNARK)
- **Merkle**: Tree binding prevents leaf swapping

## Error Handling

### Pre-submission (Client)
- ✓ Input validation (recipient address format)
- ✓ Balance check (prevent proof failure)
- ✓ Merkle proof verification (ensure root match)
- ✓ Nullifier freshness (detect double-spend early)

### On-chain (Program)
- ✗ Invalid Merkle root (race condition)
- ✗ Invalid ZK proof (mathematical failure)
- ✗ Nullifier already used (double-spend)
- ✗ Insufficient balance (shouldn't happen if client validates)

## Production Checklist

### Proof Generation
- [x] Input validation with proper error messages
- [ ] Actual Groth16 proving (currently using mock)
- [ ] Circuit file compilation (spend.wasm, spend_final.zkey)
- [ ] Witness generation optimization

### On-chain Verification
- [x] CPI to zk_verifier program
- [ ] Actual Groth16 verification (growth16 enabled)
- [ ] Poseidon hashing for Merkle verification
- [ ] Gas optimization for large trees

### Light Protocol
- [x] Merkle tree implementation
- [ ] Sync with Light mainnet API
- [ ] Batch commitment updates
- [ ] State recovery mechanism

### Security Hardening
- [ ] Formal verification of circuits
- [ ] Audit of Rust code
- [ ] Rate limiting on proofs
- [ ] Emergency pause mechanism

## Example Transaction

### User Action
```
recipient = "DYw5n52LeBbU8dyCdP3tJK8dSKJBxvJLw3Kzpw8aKYZw"
amount = 1.5 SOL
```

### Generated Proof
```
nullifier = 0x3a2b1c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b
merkleRoot = 0x9f8e7d6c5b4a3928174625340506f1a2b3c4d5e
amount (private) = 1500000000 lamports
```

### Blockchain Record
```
Transaction: 3jZqv8P7wL2m9nK4qR5sT6uV7wX8yZ9aB0cD1eF2gH3...

Visible:
- Payer: 5vLqiFjfMr3C2Z1KfKQRvxWqpfkFmhp7DvMxXzPQHJ9
- Recipient: DYw5n52LeBbU8dyCdP3tJK8dSKJBxvJLw3Kzpw8aKYZw
- Amount transferred: 1.5 SOL (computed from chain)

Hidden:
- Original amount proof: ✓ (in proof, not shown)
- Recipient identity: ✓ (encrypted in circuit)
- User's balance: ✓ (proven but not revealed)
```

## Testing

### Local Testing
```bash
# Run circuits
cd zk && pnpm run build:circuit

# Run tests
pnpm test

# Full flow with mock proof
pnpm run dev  # then ?debug=1 parameter
```

### Devnet Testing
```bash
# Deploy programs
pnpm run deploy

# Run end-to-end test
pnpm run test:e2e
```

### Mainnet Readiness
- [ ] Full audit passed
- [ ] Real Groth16 verifier
- [ ] Light Protocol mainnet integration
- [ ] Rate limiting & monitoring
- [ ] Insurance/bonding mechanism
