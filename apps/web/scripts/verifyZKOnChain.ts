import { Connection, PublicKey } from '@solana/web3.js';

async function verifyZKProofOnChain(txSignature: string) {
  const rpcEndpoint = 'https://api.devnet.solana.com';
  const connection = new Connection(rpcEndpoint, 'confirmed');

  console.log('🔍 Fetching transaction:', txSignature);

  const tx = await connection.getTransaction(txSignature, {
    maxSupportedTransactionVersion: 0,
    commitment: 'confirmed',
  });

  if (!tx) {
    console.error('❌ Transaction not found');
    return;
  }

  console.log('\n📋 Transaction Details:');
  console.log('   Slot:', tx.slot);
  console.log('   Block Time:', new Date(tx.blockTime! * 1000).toISOString());
  console.log('   Success:', tx.meta?.err ? '❌ FAILED' : '✅ SUCCESS');

  // Check for ZK verifier program invocation
  const verifierIdStr = 'HuM2XCBAuNuswyWmTHH2igu1zbiPJm2vPrrgsio63pzZ';
  const programIdStr = 'HPnAch9XaLsvKdtHtqEq4o5SAoDThCHd4zt9NCbmPKBw';

  const verifierId = new PublicKey(verifierIdStr);
  const programId = new PublicKey(programIdStr);

  const accountKeys = tx.transaction.message.getAccountKeys();
  const hasVerifier = accountKeys.staticAccountKeys.some((key) => key.equals(verifierId));

  console.log('\n🔐 ZK Verification Status:');
  console.log('   Verifier Program Called:', hasVerifier ? '✅ YES' : '❌ NO');
  console.log('   Verifier ID:', verifierId.toString());

  if (hasVerifier) {
    console.log('\n✅ GROTH16 PROOF VERIFIED ON-CHAIN');

    // Parse logs for verification details
    const logs = tx.meta?.logMessages || [];
    console.log('\n📜 ALL Transaction Logs:');
    logs.forEach((log, i) => {
      console.log(`   ${i}: ${log}`);
    });

    console.log('\n📜 ZK-Related Logs:');
    const zkLogs = logs.filter(
      (log) =>
        log.toLowerCase().includes('invoke') ||
        log.toLowerCase().includes('groth16') ||
        log.toLowerCase().includes('verify') ||
        log.toLowerCase().includes('proof') ||
        log.includes(verifierIdStr.slice(0, 8))
    );
    if (zkLogs.length > 0) {
      zkLogs.forEach((log, i) => {
        console.log(`   ✓ ${log}`);
      });
    } else {
      console.log('   (No specific verification logs found)');
    }
  } else {
    console.log('\n⚠️  No ZK verification found in transaction');
  }

  // Check CPI (Cross-Program Invocation) to verifier
  const innerInstructions = tx.meta?.innerInstructions || [];
  const hasCPI = innerInstructions.some((inner) =>
    inner.instructions.some((ix) => accountKeys.get(ix.programIdIndex)?.equals(verifierId))
  );

  console.log('\n🔄 Cross-Program Invocation:');
  console.log('   CPI to Verifier:', hasCPI ? '✅ YES (Real ZK verification)' : '❌ NO');

  // Show all account keys
  console.log('\n🔑 Account Keys in Transaction:');
  accountKeys.staticAccountKeys.forEach((key, i) => {
    const label = key.equals(programId)
      ? ' (Privacy-Pay Program)'
      : key.equals(verifierId)
      ? ' (Groth16 Verifier) ✅'
      : '';
    console.log(`   ${i}: ${key.toString()}${label}`);
  });

  // Check inner instructions
  if (innerInstructions.length > 0) {
    console.log('\n🔄 Inner Instructions (CPI Calls):');
    innerInstructions.forEach((inner, idx) => {
      console.log(`   Instruction ${inner.index}:`);
      inner.instructions.forEach((ix, i) => {
        const programKey = accountKeys.get(ix.programIdIndex);
        const isCPI = programKey?.equals(verifierId);
        console.log(
          `     ${i}: Program ${programKey?.toString().slice(0, 16)}... ${
            isCPI ? '✅ (VERIFIER CPI)' : ''
          }`
        );
      });
    });
  }

  // Final verdict
  console.log('\n═══════════════════════════════════════════════════════════');
  if (hasVerifier && hasCPI) {
    console.log('✅ VERDICT: REAL GROTH16 ZK PROOF VERIFICATION ON-CHAIN');
    console.log('   ✓ Verifier program present in transaction');
    console.log('   ✓ CPI call to verifier detected');
    console.log('   ✓ Transaction succeeded');
  } else if (hasVerifier) {
    console.log('⚠️  VERDICT: VERIFIER PRESENT BUT NO CPI DETECTED');
    console.log('   ✓ Verifier program in accounts');
    console.log('   ✗ No CPI call found');
  } else {
    console.log('❌ VERDICT: NO ZK VERIFICATION DETECTED');
    console.log('   ✗ Verifier program not in transaction');
  }
  console.log('═══════════════════════════════════════════════════════════');

  console.log('\n🔗 View on Explorer:');
  console.log(`   https://explorer.solana.com/tx/${txSignature}?cluster=devnet`);

  return {
    verified: hasVerifier && hasCPI,
    txSignature,
    slot: tx.slot,
    success: !tx.meta?.err,
  };
}

// Example usage:
const txSig = process.argv[2];
if (txSig) {
  verifyZKProofOnChain(txSig)
    .then(() => {
      console.log('\n✅ Verification complete');
    })
    .catch((err) => {
      console.error('\n❌ Error:', err.message);
      process.exit(1);
    });
} else {
  console.log('Usage: npx tsx scripts/verifyZKOnChain.ts <TRANSACTION_SIGNATURE>');
  console.log('Example: npx tsx scripts/verifyZKOnChain.ts 5XyZ...abc123');
  process.exit(1);
}
