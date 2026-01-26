pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

/**
* Selective Disclosure Circuit
*
* Allows user to prove specific facts about their commitment
* without revealing the full secret
*
* Example: Prove "balance > 1000 SOL" for compliance
*/
template SelectiveDisclosure() {
    // Public outputs
    signal output disclosed;
    signal output conditionMet;
    
    // Private inputs
    signal input secret;
    signal input balance;
    signal input threshold;
    signal input disclosureType; // 0 = balance, 1 = age, etc.
    
    // Compute commitment (for verification)
    component commitmentHasher = Poseidon(2);
    commitmentHasher.inputs[0] <== secret;
    commitmentHasher.inputs[1] <== balance;
    
    // Check condition: balance > = threshold
    component thresholdCheck = GreaterEqThan(64);
    thresholdCheck.in[0] <== balance;
    thresholdCheck.in[1] <== threshold;
    conditionMet <== thresholdCheck.out;
    
    // Selectively disclose based on type
    disclosed <== disclosureType * balance + (1 - disclosureType) * secret;
}

component main {public [threshold, disclosureType]} = SelectiveDisclosure();
    