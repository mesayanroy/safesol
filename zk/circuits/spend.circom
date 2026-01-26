pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

/**
 * Private Spend Circuit
 * 
 * Proves:
 * 1. User knows secret for commitment
 * 2. Balance >= amount being spent
 * 3. Commitment exists in Merkle tree
 * 4. Nullifier is correctly derived
 * 
 * Public inputs:
 * - nullifier (prevents double-spend)
 * - merkleRoot (current state)
 * - amount (hidden via range proof in production)
 * 
 * Private inputs:
 * - secret
 * - balance
 * - merkleProof[]
 */
template PrivateSpend(levels) {
    // Public inputs (visible on-chain)
    signal output nullifier;
    signal output merkleRoot;
    signal input amount;

    // Private inputs (hidden)
    signal input secret;
    signal input balance;
    signal input merkleProof[levels];
    signal input merklePathIndices[levels];

    // Intermediate signals
    signal commitment;
    signal merkleLeaf;

    // 1. Compute commitment = poseidon(secret, amount)
    component commitmentHasher = Poseidon(2);
    commitmentHasher.inputs[0] <== secret;
    commitmentHasher.inputs[1] <== amount;
    commitment <== commitmentHasher.out;

    // 2. Verify balance >= amount
    component balanceCheck = GreaterEqThan(64);
    balanceCheck.in[0] <== balance;
    balanceCheck.in[1] <== amount;
    balanceCheck.out === 1;

    // 3. Verify Merkle proof (commitment is in tree)
    component merkleHashers[levels];
    merkleLeaf <== commitment;
    signal merkleHashes[levels + 1];
    merkleHashes[0] <== merkleLeaf;

    for (var i = 0; i < levels; i++) {
        merkleHashers[i] = Poseidon(2);
        
        // Choose left/right based on path index
        merkleHashers[i].inputs[0] <== merkleHashes[i] * (1 - merklePathIndices[i]) + merkleProof[i] * merklePathIndices[i];
        merkleHashers[i].inputs[1] <== merkleProof[i] * (1 - merklePathIndices[i]) + merkleHashes[i] * merklePathIndices[i];
        
        merkleHashes[i + 1] <== merkleHashers[i].out;
    }

    // Root must match public input
    merkleRoot <== merkleHashes[levels];

    // 4. Compute nullifier = poseidon(commitment, secret)
    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== commitment;
    nullifierHasher.inputs[1] <== secret;
    nullifier <== nullifierHasher.out;
}

// Tree depth = 20 (supports ~1M leaves)
component main {public [amount, merkleRoot]} = PrivateSpend(20);
