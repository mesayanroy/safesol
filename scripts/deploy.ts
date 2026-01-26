import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { AnchorProvider, Wallet, Program } from '@coral-xyz/anchor';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Deploy Script
 *
 * 1. Build programs
 * 2. Deploy to devnet
 * 3. Initialize state
 * 4. Save program IDs to .env
 */

async function deploy() {
  console.log('🚀 Starting deployment to Solana devnet...\n');

  // Load deployer keypair
  const keypairPath =
    process.env.DEPLOYER_KEYPAIR || path.join(process.env.HOME!, '.config/solana/id.json');

  const deployerKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(keypairPath, 'utf-8')))
  );

  console.log('Deployer:', deployerKeypair.publicKey.toString());

  // Connect to devnet
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const balance = await connection.getBalance(deployerKeypair.publicKey);
  console.log('Balance:', balance / 1e9, 'SOL\n');

  if (balance < 2e9) {
    console.log('❌ Insufficient balance. Run: solana airdrop 2');
    process.exit(1);
  }

  // Build programs
  console.log('📦 Building programs...');
  execSync('anchor build', { stdio: 'inherit' });

  // Deploy
  console.log('\n📡 Deploying to devnet...');
  execSync('anchor deploy --provider.cluster devnet', { stdio: 'inherit' });

  // Read program IDs from target/idl
  const privacyPayIdl = JSON.parse(fs.readFileSync('target/idl/privacy_pay.json', 'utf-8'));
  const verifierIdl = JSON.parse(fs.readFileSync('target/idl/zk_verifier.json', 'utf-8'));

  const privacyPayId = new PublicKey(privacyPayIdl.metadata.address);
  const verifierId = new PublicKey(verifierIdl.metadata.address);

  console.log('\n✓ Programs deployed:');
  console.log('  Privacy Pay:', privacyPayId.toString());
  console.log('  ZK Verifier:', verifierId.toString());

  // Save to .env
  const envContent = `
NEXT_PUBLIC_PROGRAM_ID=${privacyPayId.toString()}
NEXT_PUBLIC_VERIFIER_ID=${verifierId.toString()}
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
`;

  fs.writeFileSync('apps/web/.env.local', envContent.trim());
  console.log('\n✓ Program IDs saved to apps/web/.env.local');

  console.log('\n🎉 Deployment complete!');
  console.log('\nNext steps:');
  console.log('  1. Run: npm run init-state');
  console.log('  2. Run: cd apps/web && npm run dev');
}

function execSync(cmd: string, options: any) {
  const { execSync: exec } = require('child_process');
  return exec(cmd, options);
}

deploy().catch(console.error);
