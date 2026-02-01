#!/usr/bin/env node
const crypto = require('crypto');

// Anchor uses SHA256 hash of "global:instruction_name" and takes first 8 bytes
function calculateDiscriminator(instructionName) {
  const hash = crypto.createHash('sha256')
    .update(`global:${instructionName}`)
    .digest();
  
  const discriminator = hash.slice(0, 8);
  
  console.log(`Instruction: ${instructionName}`);
  console.log(`Hash input: global:${instructionName}`);
  console.log(`Full SHA256: ${hash.toString('hex')}`);
  console.log(`Discriminator (first 8 bytes): ${discriminator.toString('hex')}`);
  console.log(`As array: [${Array.from(discriminator).map(b => '0x' + b.toString(16).padStart(2, '0')).join(', ')}]`);
  
  return discriminator;
}

// Calculate for privateSpend
calculateDiscriminator('private_spend');
