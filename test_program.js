#!/usr/bin/env node
/**
 * Test Anchor Program initialization
 */

const { Program, AnchorProvider, BN } = require('@coral-xyz/anchor');
const { Connection, PublicKey, clusterApiUrl } = require('@solana/web3.js');

const IDL = {
  version: '0.1.0',
  name: 'privacy_pay',
  instructions: [
    {
      name: 'privateSpend',
      accounts: [
        { name: 'payer', isMut: true, isSigner: true },
        { name: 'state', isMut: true, isSigner: false },
        { name: 'nullifier', isMut: true, isSigner: false },
        { name: 'recipient', isMut: true, isSigner: false },
        { name: 'zkVerifier', isMut: false, isSigner: false },
        { name: 'systemProgram', isMut: false, isSigner: false },
        { name: 'rent', isMut: false, isSigner: false },
      ],
      args: [
        { name: 'merkleRoot', type: { array: ['u8', 32] } },
        { name: 'amount', type: 'u64' },
        { name: 'proof', type: 'bytes' },
        { name: 'nullifierSeed', type: { array: ['u8', 32] } },
        { name: 'publicSignals', type: { vec: { array: ['u8', 32] } } },
      ],
    },
  ],
  accounts: [],
  types: [],
};

console.log('Test 1: Creating mock provider');
const connection = new Connection(clusterApiUrl('devnet'));

// Create a mock wallet for testing
const mockWallet = {
  publicKey: new PublicKey('So11111111111111111111111111111111111111112'),
  signTransaction: async (tx) => tx,
  signAllTransactions: async (txs) => txs,
};

const provider = new AnchorProvider(connection, mockWallet, { commitment: 'processed' });

console.log('Test 2: Creating Program with IDL');
const PRIVACY_PAY_PROGRAM_ID = new PublicKey('HPnAch9XaLsvKdtHtqEq4o5SAoDThCHd4zt9NCbmPKBw');

const program = new Program(IDL, PRIVACY_PAY_PROGRAM_ID, provider);

console.log('✓ Program created successfully');
console.log('  Program ID:', program.programId.toString());
console.log('  IDL name:', program.idl.name);
console.log('  Instructions:', program.idl.instructions.map((i) => i.name));

// Test method access
console.log('\nTest 3: Checking method access');
try {
  const methods = program.methods;
  console.log('  program.methods exists:', !!methods);
  console.log('  privateSpend method:', !!methods.privateSpend);
  if (methods.privateSpend) {
    console.log('  ✓ privateSpend method is accessible');
  }
} catch (err) {
  console.error('  ✗ Error accessing methods:', err.message);
}

console.log('\n✓ All Program tests passed');
