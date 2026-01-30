const { Connection, Keypair, PublicKey, SystemProgram, TransactionInstruction, Transaction } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');

async function initState() {
  console.log('🌱 Initializing state...\n');

  // Load deployer keypair
  const keypairPath = path.join(process.env.HOME, '.config/solana/id.json');
  const deployerKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(keypairPath, 'utf-8')))
  );

  // Connect
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  const programId = new PublicKey('HPnAch9XaLsvKdtHtqEq4o5SAoDThCHd4zt9NCbmPKBw');
  
  console.log('Program:', programId.toString());
  console.log('Deployer:', deployerKeypair.publicKey.toString());

  // Find state PDA
  const [statePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('state')],
    programId
  );

  console.log('State PDA:', statePDA.toString());

  // Check if already initialized
  const stateInfo = await connection.getAccountInfo(statePDA);
  if (stateInfo) {
    console.log('\n⚠️  State already initialized!');
    console.log('State account data length:', stateInfo.data.length);
    return;
  }

  // Genesis root (empty tree - all zeros)
  const genesisRoot = Buffer.alloc(32, 0);
  console.log('Genesis root:', genesisRoot.toString('hex').slice(0, 16) + '...');

  // Instruction discriminator for 'initialize' 
  // This is the first 8 bytes of sha256("global:initialize")
  const discriminator = Buffer.from([175, 175, 109, 31, 13, 152, 155, 237]);

  // Instruction data: discriminator + initial_root (32 bytes)
  const data = Buffer.concat([discriminator, genesisRoot]);

  console.log('\n📝 Creating initialize instruction...');

  // Create instruction
  const ix = new TransactionInstruction({
    keys: [
      { pubkey: deployerKeypair.publicKey, isSigner: true, isWritable: true }, // payer
      { pubkey: statePDA, isSigner: false, isWritable: true }, // state
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program
    ],
    programId,
    data,
  });

  // Send transaction
  const tx = new Transaction().add(ix);
  const signature = await connection.sendTransaction(tx, [deployerKeypair], {
    skipPreflight: false,
    preflightCommitment: 'confirmed',
  });

  console.log('Transaction signature:', signature);
  console.log('Waiting for confirmation...');

  await connection.confirmTransaction(signature, 'confirmed');

  console.log('\n✅ State initialized!');
  console.log('Explorer:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`);
  console.log('\n🎉 Ready to accept private payments!');
}

initState().catch(console.error);
