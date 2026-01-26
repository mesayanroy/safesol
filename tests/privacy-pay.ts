import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { PrivacyPay } from '../target/types/privacy_pay';
import { assert } from 'chai';

describe('privacy-pay', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.PrivacyPay as Program<PrivacyPay>;

  it('Initializes state', async () => {
    const genesisRoot = Buffer.alloc(32, 0);

    const [statePDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('state')],
      program.programId
    );

    const tx = await program.methods
      .initialize(Array.from(genesisRoot))
      .accounts({
        payer: provider.wallet.publicKey,
        state: statePDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log('Initialize tx:', tx);

    const state = await program.account.state.fetch(statePDA);
    assert.ok(state.authority.equals(provider.wallet.publicKey));
    assert.equal(state.totalCommitments.toNumber(), 0);
  });

  it('Executes private payment', async () => {
    const [statePDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('state')],
      program.programId
    );

    const state = await program.account.state.fetch(statePDA);
    const mockRoot = Buffer.from(state.merkleRoot);
    const mockProof = Buffer.alloc(256, 0);
    const amount = new anchor.BN(0.1 * anchor.web3.LAMPORTS_PER_SOL);

    const recipient = anchor.web3.Keypair.generate();

    const [nullifierPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('nullifier'), mockRoot.subarray(0, 32)],
      program.programId
    );

    const tx = await program.methods
      .privateSpend(Array.from(mockRoot), amount, Array.from(mockProof))
      .accounts({
        payer: provider.wallet.publicKey,
        state: statePDA,
        nullifier: nullifierPDA,
        recipient: recipient.publicKey,
        zkVerifier: new anchor.web3.PublicKey('Verifier1111111111111111111111111111111111'),
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    console.log('Private spend tx:', tx);

    // Verify nullifier created
    const nullifier = await program.account.nullifier.fetch(nullifierPDA);
    assert.ok(nullifier.usedAt.toNumber() > 0);
  });
});
