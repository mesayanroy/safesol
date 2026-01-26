# ZK Circuit Build Instructions

## Prerequisites

```bash
npm install -g circom
npm install -g snarkjs
npm install circomlib
```

## Build Circuits

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

## For Hackathon (Fast Track)

Skip circuit compilation and use mocked proofs in frontend:
- Set `useMock: true` in `apps/web/lib/zk.ts`
- Frontend will generate mock proofs instantly
- Solana program accepts any proof (verifier is mocked)

## For Production

1. Build all circuits (takes ~10-30 minutes)
2. Set `useMock: false` in frontend
3. Replace mock verifier with real Groth16 verifier in `programs/zk-verifier`
4. Deploy verification key on-chain

## Circuit Sizes

- spend.circom: ~50K constraints
- membership.circom: ~20K constraints
- disclosure.circom: ~10K constraints
