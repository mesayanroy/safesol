import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { AnchorProvider, Wallet, Program, BN } from '@coral-xyz/anchor';
import * as fs from 'fs';
import * as path from 'path';
import { buildPoseidon } from 'circomlibjs';

/**
 * Initialize State Script
 *
 * 1. Create state PDA with genesis Merkle root
 * 2. Add initial commitments (optional)
 */

async function initState() {
  console.log('🌱 Initializing state...\n');

  // Load deployer keypair
  const keypairPath =
    process.env.DEPLOYER_KEYPAIR || path.join(process.env.HOME!, '.config/solana/id.json');

  const deployerKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(keypairPath, 'utf-8')))
  );

  // Connect
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const wallet = new Wallet(deployerKeypair);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
  });

  // Load program
  const idl = JSON.parse(fs.readFileSync('target/idl/privacy_pay.json', 'utf-8'));
  const programId = new PublicKey('HPnAch9XaLsvKdtHtqEq4o5SAoDThCHd4zt9NCbmPKBw');
  const program = new Program(idl, programId, provider);

  console.log('Program:', programId.toString());

  // Generate genesis Merkle root (empty tree)
  const poseidon = await buildPoseidon();
  const genesisRoot = Buffer.alloc(32, 0); // All zeros for empty tree

  console.log('Genesis root:', genesisRoot.toString('hex').slice(0, 16) + '...');

  // Find state PDA
  const [statePDA] = PublicKey.findProgramAddressSync([Buffer.from('state')], programId);

  console.log('State PDA:', statePDA.toString());

  // Check if already initialized
  try {
    const state = await program.account.state.fetch(statePDA);
    console.log('\n⚠️  State already initialized!');
    console.log(
      'Current root:',
      Buffer.from(state.merkleRoot).toString('hex').slice(0, 16) + '...'
    );
    console.log('Total commitments:', state.totalCommitments.toString());
    return;
  } catch (err) {
    // Not initialized yet, proceed
  }

  // Initialize
  console.log('\n📝 Initializing state PDA...');

  const tx = await program.methods
    .initialize(Array.from(genesisRoot))
    .accounts({
      payer: deployerKeypair.publicKey,
      state: statePDA,
      systemProgram: new PublicKey('11111111111111111111111111111111'),
    })
    .rpc();

  console.log('✓ Transaction:', tx);

  // Verify
  const state = await program.account.state.fetch(statePDA);
  console.log('\n✅ State initialized!');
  console.log('Authority:', state.authority.toString());
  console.log('Merkle root:', Buffer.from(state.merkleRoot).toString('hex').slice(0, 16) + '...');
  console.log('Total commitments:', state.totalCommitments.toString());

  console.log('\n🎉 Ready to accept private payments!');
}

initState().catch(console.error);
