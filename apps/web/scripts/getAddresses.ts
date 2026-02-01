import { Connection, PublicKey } from '@solana/web3.js';

async function getAddresses() {
  try {
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const programId = new PublicKey('HPnAch9XaLsvKdtHtqEq4o5SAoDThCHd4zt9NCbmPKBw');

    console.log('🔍 Getting Merkle Root & PDA Addresses...\n');

    // Step 1: Get State PDA (where merkle root is stored)
    const [statePDA] = PublicKey.findProgramAddressSync([Buffer.from('state')], programId);

    console.log('📋 STATE PDA ADDRESS:');
    console.log('   ', statePDA.toString());
    console.log();

    // Step 2: Fetch the merkle root from state
    const stateAccount = await connection.getAccountInfo(statePDA);

    if (!stateAccount) {
      console.error('❌ State PDA not found on devnet');
      console.log('   Make sure you ran: npx tsx scripts/init_state.ts');
      process.exit(1);
    }

    // Parse merkle root (offset: 8-byte discriminator + 32-byte authority = 40)
    const merkleRootBytes = stateAccount.data.slice(40, 72);
    const merkleRootHex = Buffer.from(merkleRootBytes).toString('hex');

    console.log('🔐 CURRENT MERKLE ROOT:');
    console.log('   Hex:', merkleRootHex);
    console.log('   First 16 chars:', merkleRootHex.slice(0, 16) + '...');
    console.log();

    // Step 3: Derive compressed merkle root PDA
    const [compressedMerklePDA, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from('merkle_root'), programId.toBuffer(), merkleRootBytes],
      programId
    );

    console.log('📦 COMPRESSED MERKLE ROOT PDA:');
    console.log('   Address:', compressedMerklePDA.toString());
    console.log('   Bump:', bump);
    console.log();

    // Step 4: Check if compressed account exists
    const compressedAccount = await connection.getAccountInfo(compressedMerklePDA);

    if (compressedAccount) {
      const isLightProtocol =
        compressedAccount.owner.toString().includes('SySTEM') ||
        compressedAccount.data.length <= 16;

      console.log('✅ COMPRESSED ACCOUNT STATUS: EXISTS ON-CHAIN');
      console.log('   Owner:', compressedAccount.owner.toString());
      console.log('   Data size:', compressedAccount.data.length, 'bytes');
      console.log('   Lamports:', compressedAccount.lamports);
      console.log(
        '   Light Protocol compressed:',
        isLightProtocol ? '✅ YES' : '⚠️  NO (standard PDA)'
      );

      if (compressedAccount.data.length <= 16) {
        console.log(
          '   Compression ratio:',
          ((1 - compressedAccount.data.length / 32) * 100).toFixed(0) + '%'
        );
      }
    } else {
      console.log('⚠️  COMPRESSED ACCOUNT STATUS: NOT CREATED YET');
      console.log('   This account will be created when you make your first payment');
      console.log('   with Light Protocol compression enabled');
    }

    console.log();
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 VERIFICATION COMMANDS:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log();
    console.log('1. Check State PDA (standard):');
    console.log(`   solana account ${statePDA.toString()} --url devnet`);
    console.log();
    console.log('2. Check Compressed Merkle Root PDA:');
    console.log(`   solana account ${compressedMerklePDA.toString()} --url devnet`);
    console.log();
    console.log('3. Check on Solana Explorer:');
    console.log(`   https://explorer.solana.com/address/${statePDA.toString()}?cluster=devnet`);
    console.log(
      `   https://explorer.solana.com/address/${compressedMerklePDA.toString()}?cluster=devnet`
    );
    console.log();
    console.log('═══════════════════════════════════════════════════════════');

    // Summary
    console.log();
    console.log('📊 SUMMARY:');
    console.log('   State PDA:', statePDA.toString());
    console.log('   Merkle Root:', merkleRootHex.slice(0, 32) + '...');
    console.log('   Compressed PDA:', compressedMerklePDA.toString());
    console.log('   Status:', compressedAccount ? '✅ On-chain' : '⚠️  Not created yet');
    console.log();
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

getAddresses();
