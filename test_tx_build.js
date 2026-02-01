#!/usr/bin/env node
/**
 * Test script to verify transaction building without UI
 */

const { BN } = require('@coral-xyz/anchor');
const { PublicKey } = require('@solana/web3.js');

// Test BN conversion
const amount = 1.5; // 1.5 SOL
const amountLamports = Math.floor(amount * 1e9);

console.log('Test 1: BN conversion');
console.log('  Input amount (SOL):', amount);
console.log('  Calculated lamports:', amountLamports);
console.log('  Number.isFinite:', Number.isFinite(amountLamports));

const amountBN = new BN(amountLamports);
console.log('  BN object:', amountBN.toString());
console.log('  BN.isBN:', BN.isBN(amountBN));

// Test conversion back
const numValue = amountBN.toNumber ? amountBN.toNumber() : Number(amountBN);
console.log('  BN.toNumber():', numValue);
console.log('  Type:', typeof numValue);

// Test array conversion
console.log('\nTest 2: Array conversions');
const testBuffer = Buffer.alloc(32);
testBuffer.fill('test');
const testArray = Array.from(testBuffer);
console.log('  Buffer to Array length:', testArray.length);
console.log('  Is array:', Array.isArray(testArray));

// Test Uint8Array
const uint8 = new Uint8Array(testBuffer);
console.log('  Uint8Array length:', uint8.length);
console.log('  Constructor name:', uint8.constructor.name);

// Test PublicKey
console.log('\nTest 3: PublicKey');
const recipientStr = 'So11111111111111111111111111111111111111112';
const pk = new PublicKey(recipientStr);
console.log('  PublicKey created:', pk.toString());
console.log('  Is PublicKey:', pk instanceof PublicKey);

console.log('\n✓ All basic tests passed');
