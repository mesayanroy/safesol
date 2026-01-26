pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";

/**
* Membership Proof Circuit
*
* Proves a commitment is in the Merkle tree
* WITHOUT revealing which leaf it is
*/
template Membership(levels) {
    // Public
    signal input merkleRoot;
    
    // Private
    signal input commitment;
    signal input merkleProof[levels];
    signal input merklePathIndices[levels];
    
    // Verify Merkle proof
    component merkleHashers[levels];
    signal merkleHashes[levels + 1];
    merkleHashes[0] <== commitment;
    
    for (var i = 0; i < levels; i++) {
        merkleHashers[i] = Poseidon(2);
        
        merkleHashers[i].inputs[0] <== merkleHashes[i] * (1 - merklePathIndices[i]) + merkleProof[i] * merklePathIndices[i];
        merkleHashers[i].inputs[1] <== merkleProof[i] * (1 - merklePathIndices[i]) + merkleHashes[i] * merklePathIndices[i];
        
        merkleHashes[i + 1] <== merkleHashers[i].out;
    }
    
    // Constrain root
    merkleRoot === merkleHashes[levels];
}

component main {public [merkleRoot]} = Membership(20);
    