/**
 * Private Spend Circuit - Compatible with Circom 0.5.46
 * 
 * Note: Circom 0.5.x makes all inputs public signals
 * This is a simplified version for testing
 */

// Simple addition hash  
template AddHash() {
    signal input a;
    signal input b;
    signal output c;
    
    c <== a + b;
}

// Main circuit - minimal version for testing
template PrivateSpend() {
    // All inputs (these become public in Circom 0.5.x)
    signal input secret;
    signal input amount;
    
    // Output
    signal output nullifier;
    
    // Compute nullifier = secret + amount
    component hash = AddHash();
    hash.a <== secret;
    hash.b <== amount;
    nullifier <== hash.c;
}

component main = PrivateSpend();
