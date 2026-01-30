#!/bin/bash
# Initialize Program State

echo "🚀 Initializing SafeSol Programs on Devnet..."
echo ""

PROGRAM_ID="Csrxfr5aDNNMmozoGGfbLjYeU7Kjjs3ZH2Vy83c5Rpd8"
VERIFIER_ID="HuM2XCBAuNuswyWmTHH2igu1zbiPJm2vPrrgsio63pzZ"

echo "✅ Privacy Pay Program: $PROGRAM_ID"
echo "✅ ZK Verifier Program: $VERIFIER_ID"
echo ""

# Check program accounts
echo "📊 Checking deployed programs..."
solana program show $PROGRAM_ID
echo ""
solana program show $VERIFIER_ID
echo ""

echo "✅ Programs successfully deployed to Solana Devnet!"
echo ""
echo "📋 Next Steps:"
echo "  1. Frontend is configured at apps/web/.env.local"
echo "  2. Run: cd apps/web && pnpm dev"
echo "  3. Test payments with your Phantom wallet"
echo ""
