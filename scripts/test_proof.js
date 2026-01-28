/**
 * Test Groth16 Proof Generation
 * 
 * This script tests the complete proof generation flow with real circuits
 */

const snarkjs = require('snarkjs');
const fs = require('fs');
const path = require('path');

async function testProofGeneration() {
  console.log('=== Testing Groth16 Proof Generation ===\n');

  // Paths to circuit artifacts
  const wasmPath = path.join(__dirname, '../zk/artifacts/spend.wasm');
  const zkeyPath = path.join(__dirname, '../zk/artifacts/spend_final.zkey');
  const vkeyPath = path.join(__dirname, '../zk/artifacts/verification_key.json');

  // Check files exist
  console.log('1. Checking circuit files...');
  const filesExist = [
    { path: wasmPath, name: 'WASM' },
    { path: zkeyPath, name: 'Proving Key' },
    { path: vkeyPath, name: 'Verification Key' }
  ].every(({ path: p, name }) => {
    const exists = fs.existsSync(p);
    console.log(`   ${exists ? '✓' : '✗'} ${name}: ${p}`);
    return exists;
  });

  if (!filesExist) {
    console.error('\n❌ Missing circuit files. Run: cd zk && bash setup.sh');
    process.exit(1);
  }

  // Prepare test inputs (matching simplified circuit)
  console.log('\n2. Preparing circuit inputs...');
  const inputs = {
    secret: '12345',
    amount: '1000000000' // 1 SOL
  };
  console.log('   Secret:', inputs.secret);
  console.log('   Amount:', inputs.amount);

  // Generate proof
  console.log('\n3. Generating proof...');
  const startTime = Date.now();
  
  try {
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      inputs,
      wasmPath,
      zkeyPath
    );
    
    const duration = Date.now() - startTime;
    console.log(`   ✓ Proof generated in ${duration}ms`);
    console.log('   Public signals:', publicSignals.length, 'values');
    console.log('   First signal:', publicSignals[0]);

    // Verify proof
    console.log('\n4. Verifying proof...');
    const vkey = JSON.parse(fs.readFileSync(vkeyPath, 'utf-8'));
    const isValid = await snarkjs.groth16.verify(vkey, publicSignals, proof);
    
    if (isValid) {
      console.log('   ✓ Proof is VALID');
    } else {
      console.log('   ✗ Proof is INVALID');
      process.exit(1);
    }

    // Check proof size
    console.log('\n5. Proof statistics...');
    const proofJson = JSON.stringify(proof);
    console.log('   Proof size:', proofJson.length, 'bytes (JSON)');
    console.log('   Protocol:', proof.protocol);
    console.log('   Curve:', proof.curve);

    console.log('\n✅ All tests passed!');
    console.log('🚀 Real Groth16 proofs are working correctly');
    
  } catch (error) {
    console.error('\n❌ Proof generation failed:');
    console.error(error);
    process.exit(1);
  }
}

testProofGeneration().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
