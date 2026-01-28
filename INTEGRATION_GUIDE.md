# SafeSol Integration Guide

## Setup Required Components

### 1. Circuit Files (ZK Compilation)

**Location**: `/zk/circuits/`

Required files:
```
spend.circom          - Main privacy payment circuit (20-level tree)
disclosure.circom     - Range proof for amount validation
membership.circom     - Merkle tree membership proof
```

**Compilation**:
```bash
cd zk
pnpm run build:circuit

# Generates:
# - spend.wasm              (compiled circuit)
# - spend_final.zkey        (proving/verification key)
# - spend_vkey.json         (verification key)
```

**Circuit Logic**:
- Input: secret, amount, balance, merkleProof[], merklePathIndices[]
- Prove: 
  - commitment = poseidon(secret, amount)
  - balance ≥ amount
  - commitment in merkle tree
  - nullifier = poseidon(commitment, secret)
- Output: nullifier, merkleRoot, amount (hidden)

### 2. ZK Verifier Program (Groth16)

**Location**: `/programs/zk-verifier/`

**Features enabled**:
```toml
[features]
growth16 = []  # For 16-bit field arithmetic optimization
default = ["growth16"]
```

**Functions**:
```rust
verify_proof(proof: [u8; 256], publicSignals: [[u8; 32]])
├─ Parses: pi_a, pi_b, pi_c (Groth16 format)
├─ Checks: e(pi_a, pi_b) == e(α, β) * ...
└─ Returns: Ok() if valid, Err() if invalid

verify_commitment(commitment, merkleRoot, proof, indices)
├─ Reconstructs Merkle root
└─ Validates commitment membership

verify_nullifier_unused(nullifier)
└─ Ensures nullifier hasn't been used
```

**Status**: ✅ Enabled with growth16

### 3. Privacy Pay Program

**Location**: `/programs/privacy-pay/src/`

**Instructions**:
```rust
initialize(initialRoot: [u8; 32])
├─ Creates state PDA
└─ Sets genesis Merkle root

private_spend(merkleRoot, amount, proof, nullifierSeed, publicSignals)
├─ Verifies Merkle root matches state
├─ Verifies ZK proof (CPI to verifier)
├─ Creates nullifier PDA (double-spend prevention)
├─ Updates Merkle root
└─ Transfers SOL to recipient
```

**Error Codes**:
- `InvalidMerkleRoot`: Root doesn't match state
- `InvalidProofSize`: Proof not 256 bytes
- `InvalidSignalCount`: Need 3+ public signals
- `MerkleRootMismatch`: Signal root != provided root

### 4. Web Application

**Location**: `/apps/web/`

**Key modules**:

#### `/lib/zk.ts`
- `generateSecret()`: Create random secret
- `generateCommitment(secret, amount)`: Poseidon hash
- `generateNullifier(commitment, secret)`: Prevent double-spend
- `generateSpendProof(inputs)`: Generate Groth16 proof
- `serializeProofForSolana(proof)`: Format for blockchain

**Usage**:
```typescript
const secret = generateSecret();
const commitment = await generateCommitment(secret, BigInt(1e9));
const proof = await generateSpendProof({
  secret,
  amount: BigInt(1e9),
  balance: BigInt(10e9),
  merkleProof: [BigInt(0), BigInt(0), ...],
  merkleRoot: BigInt(0),
  recipient: "DYw5n52LeBbU8dyCdP3tJK8dSKJBxvJLw3Kzpw8aKYZw",
}, false); // false = use real Groth16
```

#### `/lib/merkle-tree.ts`
- `MerkleTree` class: Sparse 20-level tree
- `generateSparseProof()`: Efficient proof generation
- `verifyMerkleProof()`: Local verification
- `computeMerkleRoot()`: Reconstruct root from proof

**Usage**:
```typescript
const tree = new MerkleTree(20);
const index = await tree.addLeaf(commitment);
const proof = await tree.getProof(index);
const isValid = await verifyMerkleProof(
  commitment,
  proof.path,
  proof.indices,
  proof.root
);
```

#### `/lib/light.ts`
- `LightProtocolClient`: Compressed state management
- `storeCompressedCommitment()`: Add to tree
- `getCommitmentProof()`: Get Merkle path
- `verifyCompressedProof()`: Validate before submit
- `getCurrentRoot()`: Get tree root

**Usage**:
```typescript
const light = new LightProtocolClient(connection);
const compressed = await light.storeCompressedCommitment(
  commitment.toString(),
  wallet.publicKey
);
const proof = await light.getCommitmentProof(commitment.toString());
const isValid = await light.verifyCompressedProof(
  commitment.toString(),
  proof,
  await light.getCurrentRoot()
);
```

#### `/lib/solana.ts`
- `buildPrivatePaymentTx()`: Build transaction
- `initializeState()`: One-time state setup
- `getCurrentMerkleRoot()`: Fetch from blockchain
- `isNullifierUsed()`: Check for double-spend

**Usage**:
```typescript
const tx = await buildPrivatePaymentTx(provider, {
  proof,
  amount: new BN(1e9),
  recipient: new PublicKey("DYw5..."),
  merkleRoot: Buffer.from(root),
  nullifierSeed: Buffer.from(nullifier.slice(0, 64), 'hex'),
});
const sig = await wallet.sendTransaction(tx, connection);
```

## Transaction Flow Implementation

### Client Side (Frontend)

```typescript
// 1. User enters recipient & amount
const recipient = "DYw5n52LeBbU8dyCdP3tJK8dSKJBxvJLw3Kzpw8aKYZw";
const amount = 1.5; // SOL

// 2. Initialize components
const light = new LightProtocolClient(connection);

// 3. Generate commitment
const secret = generateSecret();
const commitment = await generateCommitment(secret, BigInt(amount * 1e9));

// 4. Get Merkle proof from Light
const merkleProof = await light.getCommitmentProof(commitment.toString());
const currentRoot = await light.getCurrentRoot();

// 5. Calculate path indices
const { path, indices } = await calculateMerklePath(
  commitment,
  merkleProof.map(p => BigInt(p))
);

// 6. Generate ZK proof
const proof = await generateSpendProof({
  secret,
  amount: BigInt(amount * 1e9),
  balance: BigInt(10e9), // Get from wallet balance
  merkleProof: path,
  merkleRoot: BigInt(currentRoot),
  recipient,
}, false); // Use real Groth16

// 7. Verify proof locally
const isValid = await light.verifyCompressedProof(
  commitment.toString(),
  merkleProof,
  currentRoot
);

if (!isValid) {
  throw new Error("Proof verification failed");
}

// 8. Build transaction
const tx = await buildPrivatePaymentTx(provider, {
  proof,
  amount: new BN(amount * 1e9),
  recipient: new PublicKey(recipient),
  merkleRoot: Buffer.from(currentRoot.slice(2), 'hex'),
  nullifierSeed: Buffer.from(proof.nullifier.slice(0, 64), 'hex'),
});

// 9. Sign and send
const signature = await wallet.sendTransaction(tx, connection);

// 10. Confirm
await connection.confirmTransaction(signature, 'confirmed');

// 11. Update Light state
await light.storeCompressedCommitment(
  commitment.toString(),
  wallet.publicKey
);
```

### Program Side (Blockchain)

```rust
// 1. Verify Merkle root matches state
require!(
  state.merkle_root == merkle_root,
  ErrorCode::InvalidMerkleRoot
);

// 2. Verify ZK proof (CPI)
invoke(
  &verify_proof_instruction,
  &[zk_verifier.to_account_info()],
)?;

// 3. Check nullifier freshness
// (PDA init will fail if exists)

// 4. Create nullifier PDA
nullifier.hash = nullifier_seed;
nullifier.used_at = Clock::get()?.unix_timestamp;

// 5. Update Merkle root
state.merkle_root = compute_new_root(...);

// 6. Transfer SOL
invoke(
  &transfer_instruction,
  &[payer.to_account_info(), recipient.to_account_info(), ...],
)?;
```

## Merkle Tree Management

### Local Tree (Development)
```typescript
const tree = new MerkleTree(20); // 20-level tree

// Add commitment
const leafIndex = await tree.addLeaf(commitment);

// Get proof
const proofData = await tree.getProof(leafIndex);

// Verify locally
const isValid = await verifyMerkleProof(
  commitment,
  proofData.path,
  proofData.indices,
  proofData.root
);

// Export/import for persistence
const state = tree.exportState();
await tree.importState(state);
```

### Light Protocol (Production)
```typescript
const light = new LightProtocolClient(connection);

// Store commitment
const compressed = await light.storeCompressedCommitment(
  commitment.toString(),
  programId
);

// Get proof
const proof = await light.getCommitmentProof(commitment.toString());

// Get current root
const root = await light.getCurrentRoot();

// Verify
const isValid = await light.verifyCompressedProof(
  commitment.toString(),
  proof,
  root
);

// Stats
const stats = light.getStats();
console.log(`Total commitments: ${stats.totalCommitments}`);
```

## Debugging

### Enable Debug Mode
```
http://localhost:3000?debug=1
```

### Check Proof Generation
```typescript
console.log('[ZK] Inputs:', {
  secret: inputs.secret.toString().slice(0, 32),
  amount: inputs.amount.toString(),
  commitment: commitment.toString().slice(0, 32),
  nullifier: nullifier.toString().slice(0, 32),
  merkleProof: inputs.merkleProof.length,
  merkleRoot: inputs.merkleRoot.toString().slice(0, 32),
});
```

### Verify Merkle Root
```typescript
const light = new LightProtocolClient(connection);
const root = await light.getCurrentRoot();
console.log('Current root:', root);

const isValid = await light.verifyCompressedProof(...);
console.log('Proof valid:', isValid);
```

### Check Double-Spend Prevention
```typescript
const nullifierSeed = Buffer.from(proof.nullifier.slice(0, 64), 'hex');
const [nullifierPDA] = findNullifierPDA(nullifierSeed);
const accountInfo = await connection.getAccountInfo(nullifierPDA);
console.log('Nullifier used:', accountInfo !== null);
```

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_PROGRAM_ID=8nD1jMsRYEc8qCauqbKbWaoVmF8wsf13baDzQcfaJLUv
NEXT_PUBLIC_VERIFIER_ID=Verifier1111111111111111111111111111111111
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
```

Update after deployment:
```bash
pnpm run deploy
# Copies program IDs to .env
```

## Performance Optimizations

### Circuit Level
- Poseidon hash: 1M constraints per proof
- Merkle verification: 20 levels = 20 hashes
- Total size: ~1.2M constraints

### On-chain Level
- Groth16 proof: 256 bytes
- Public signals: 3 × 32 bytes
- CPI overhead: ~2000 CU

### Compression Level
- Standard account: 890 bytes
- Light compressed: ~0 bytes per commitment
- Saving: 100x cheaper per state update

## Common Issues

### "Cannot read the provided"
- Check circuit inputs format
- Verify Merkle proof path length
- Ensure nullifier seed is 32 bytes

### "Invalid Merkle root"
- Root changed between local computation and submission
- Race condition: Another transaction updated tree
- Solution: Retry with latest root

### "Proof verification failed"
- Groth16 verification key mismatch
- Proof corrupted during serialization
- Public signals incorrect format

### "Nullifier already used"
- Same proof submitted twice
- Prevention working correctly
- Use different secret for new payment

## Next Steps

1. **Compile Circuits**
   ```bash
   cd zk
   pnpm run build:circuit
   ```

2. **Deploy Programs**
   ```bash
   pnpm run deploy
   ```

3. **Run Local Tests**
   ```bash
   pnpm test
   ```

4. **Launch Development Server**
   ```bash
   pnpm run dev
   # Visit http://localhost:3000
   ```

5. **Test Payment Flow**
   - Connect Phantom wallet
   - Enter recipient & amount
   - Click "Generate Proof & Send Payment"
   - Watch console logs for detailed flow
   - Check Solana Explorer for transaction

## References

- Circom Documentation: https://docs.circom.io/
- Groth16 Proof System: https://eprint.iacr.org/2016/260.pdf
- Poseidon Hash: https://www.poseidon-hash.info/
- Light Protocol: https://www.lightprotocol.com/
- Solana Anchor: https://www.anchor-lang.com/
