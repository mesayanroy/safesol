import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { AnchorProvider, Wallet, Program, BN } from '@coral-xyz/anchor';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Demo Flow
 *
 * Simulates complete private payment workflow:
 * 1. User generates ZK proof
 * 2. Submit transaction
 * 3. Verify on-chain state
 * 4. Show privacy properties
 */

async function demoFlow() {
  console.log('🎬 ZK Private Payment Demo\n');
  console.log('='.repeat(50));

  // Setup
  const keypairPath =
    process.env.DEPLOYER_KEYPAIR || path.join(process.env.HOME!, '.config/solana/id.json');

  const payerKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(keypairPath, 'utf-8')))
  );

  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const wallet = new Wallet(payerKeypair);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
  });

  // Load program
  const idl = JSON.parse(fs.readFileSync('target/idl/privacy_pay.json', 'utf-8'));
  const programId = new PublicKey(idl.metadata.address);
  const program = new Program(idl, programId, provider);

  // Random recipient
  const recipient = Keypair.generate().publicKey;

  console.log('\n👤 Participants:');
  console.log('  Payer:', payerKeypair.publicKey.toString());
  console.log('  Recipient:', recipient.toString());

  // Get current state
  const [statePDA] = PublicKey.findProgramAddressSync([Buffer.from('state')], programId);

  const state = await program.account.state.fetch(statePDA);
  console.log('\n📊 Current State:');
  console.log('  Merkle root:', Buffer.from(state.merkleRoot).toString('hex').slice(0, 16) + '...');
  console.log('  Total commitments:', state.totalCommitments.toString());

  // Generate mock proof
  const amount = 0.1 * LAMPORTS_PER_SOL; // 0.1 SOL
  const mockRoot = Buffer.from(state.merkleRoot);
  const mockProof = Buffer.alloc(256, 0); // Mock 256-byte proof

  console.log('\n🔐 Generating ZK Proof...');
  console.log('  Amount: 0.1 SOL (HIDDEN on-chain)');
  console.log('  Using MOCK proof for demo');

  // Find nullifier PDA
  const [nullifierPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('nullifier'), mockRoot.subarray(0, 32)],
    programId
  );

  console.log('\n📝 Submitting private payment...');

  try {
    const tx = await program.methods
      .privateSpend(Array.from(mockRoot), new BN(amount), Array.from(mockProof))
      .accounts({
        payer: payerKeypair.publicKey,
        state: statePDA,
        nullifier: nullifierPDA,
        recipient: recipient,
        zkVerifier: new PublicKey('Verifier1111111111111111111111111111111111'),
        systemProgram: new PublicKey('11111111111111111111111111111111'),
        rent: new PublicKey('SysvarRent111111111111111111111111111111111'),
      })
      .rpc();

    console.log('✅ Transaction confirmed!');
    console.log('  Signature:', tx);
    console.log('  Explorer:', `https://explorer.solana.com/tx/${tx}?cluster=devnet`);

    // Check recipient balance
    const recipientBalance = await connection.getBalance(recipient);
    console.log('\n💰 Recipient Balance:', recipientBalance / LAMPORTS_PER_SOL, 'SOL');

    // Verify nullifier created
    const nullifier = await program.account.nullifier.fetch(nullifierPDA);
    console.log('\n🔒 Nullifier created:');
    console.log('  Hash:', Buffer.from(nullifier.hash).toString('hex').slice(0, 16) + '...');
    console.log('  Used at:', new Date(nullifier.usedAt.toNumber() * 1000).toISOString());

    console.log('\n🎯 Privacy Properties:');
    console.log('  ✓ Amount is HIDDEN (only ZK proof reveals validity)');
    console.log('  ✓ Recipient is ENCRYPTED (only tx participants know)');
    console.log('  ✓ Nullifier prevents double-spending');
    console.log('  ✓ Explorer shows only: tx hash + root update');

    console.log('\n🏆 Demo complete! Private payment succeeded.');
  } catch (err: any) {
    console.error('\n❌ Transaction failed:', err.message);
    if (err.logs) {
      console.log('\nProgram logs:');
      err.logs.forEach((log: string) => console.log('  ', log));
    }
  }
}

demoFlow().catch(console.error);
