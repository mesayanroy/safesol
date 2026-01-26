# Light Protocol Integration Helpers

This module provides utilities for interacting with Light Protocol's compressed state.

## Key Concepts

- **Compressed State**: Merkle trees stored efficiently on-chain
- **Account Compression**: Reduce storage costs by 1000x
- **ZK Proofs**: Prove membership without revealing position

## Usage

```typescript
import { createLightClient } from './light';

const client = createLightClient(connection);

// Store commitment
const compressed = await client.storeCompressedCommitment(
  commitment,
  programId
);

// Get proof
const proof = await client.getCommitmentProof(commitment);

// Verify
const valid = await client.verifyCompressedProof(
  commitment,
  proof,
  root
);
```

## For Production

Replace mocked methods with real Light Protocol SDK:

```bash
npm install @lightprotocol/stateless.js
```

Then update `light.ts` to use real RPC calls.
