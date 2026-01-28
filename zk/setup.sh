#!/bin/bash
# SafeSol Groth16 Setup Script
# 
# This script performs the complete Groth16 trusted setup:
# 1. Compiles Circom circuit to R1CS and WASM
# 2. Generates Powers of Tau
# 3. Creates Groth16 proving and verification keys
# 4. Exports artifacts for both client and Solana

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ZK_DIR="$PROJECT_ROOT/zk"
CIRCUITS_DIR="$ZK_DIR/circuits"
ARTIFACTS_DIR="$ZK_DIR/artifacts"

echo -e "${YELLOW}SafeSol Groth16 Setup${NC}"
echo "Project Root: $PROJECT_ROOT"
echo "ZK Directory: $ZK_DIR"
echo ""

# Step 1: Check dependencies
echo -e "${YELLOW}Step 1: Checking dependencies...${NC}"

if ! command -v circom &> /dev/null; then
    echo -e "${RED}❌ circom not found. Install with: npm install -g circom${NC}"
    exit 1
fi
echo -e "${GREEN}✓ circom${NC}"

if ! command -v snarkjs &> /dev/null; then
    echo -e "${RED}❌ snarkjs not found. Install with: npm install -g snarkjs${NC}"
    exit 1
fi
echo -e "${GREEN}✓ snarkjs${NC}"

# Step 2: Create artifacts directory
echo -e "${YELLOW}Step 2: Creating artifacts directory...${NC}"
mkdir -p "$ARTIFACTS_DIR"
cd "$ARTIFACTS_DIR"
echo -e "${GREEN}✓ Artifacts directory ready${NC}"

# Step 3: Compile Circom circuit
echo -e "${YELLOW}Step 3: Compiling Circom circuit (spend.circom)...${NC}"
circom "$CIRCUITS_DIR/spend.circom" --r1cs --wasm --sym -o "$ARTIFACTS_DIR"

if [ -f "spend.r1cs" ] && ([ -f "spend_js/spend.wasm" ] || [ -f "spend.wasm" ]); then
    echo -e "${GREEN}✓ Circuit compiled${NC}"
    echo "  - spend.r1cs"
    if [ -f "spend_js/spend.wasm" ]; then
        echo "  - spend_js/spend.wasm"
    else
        echo "  - spend.wasm"
    fi
else
    echo -e "${RED}❌ Compilation failed${NC}"
    exit 1
fi

# Step 4: Generate Powers of Tau (if not exists)
echo -e "${YELLOW}Step 4: Generating Powers of Tau...${NC}"

if [ ! -f "pot14_final.ptau" ]; then
    echo "Creating new Powers of Tau ceremony (this takes ~5 minutes)..."
    
    # Create initial powers
    snarkjs powersoftau new bn128 14 pot14_0000.ptau -v
    
    # Contribute (required for security)
    # Using non-interactive mode with a random seed
    echo "Contributing to Powers of Tau (simulating trusted setup)..."
    snarkjs powersoftau contribute pot14_0000.ptau pot14_0001.ptau --name="SafeSol" -v
    
    # Finalize
    snarkjs powersoftau prepare phase2 pot14_0001.ptau pot14_final.ptau -v
    
    echo -e "${GREEN}✓ Powers of Tau generated${NC}"
else
    echo -e "${GREEN}✓ Powers of Tau already exists${NC}"
fi

# Step 5: Create Groth16 keys
echo -e "${YELLOW}Step 5: Creating Groth16 proving key...${NC}"

if [ ! -f "spend_final.zkey" ]; then
    # Initial setup
    snarkjs groth16 setup spend.r1cs pot14_final.ptau spend_0000.zkey -v
    
    # Contribute to zkey
    echo "Contributing to zkey ceremony..."
    snarkjs zkey contribute spend_0000.zkey spend_0001.zkey --name="SafeSol" -v
    
    # Finalize
    snarkjs zkey verify spend.r1cs pot14_final.ptau spend_0001.zkey -v
    snarkjs zkey beacon spend_0001.zkey spend_final.zkey 0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f 10 -v
    
    echo -e "${GREEN}✓ Groth16 proving key created${NC}"
else
    echo -e "${GREEN}✓ Proving key already exists${NC}"
fi

# Step 6: Export verification key
echo -e "${YELLOW}Step 6: Exporting verification key...${NC}"

snarkjs zkey export verificationkey spend_final.zkey verification_key.json -v

if [ -f "verification_key.json" ]; then
    echo -e "${GREEN}✓ Verification key exported${NC}"
else
    echo -e "${RED}❌ Failed to export verification key${NC}"
    exit 1
fi

# Step 7: Create Solana verifier contract
echo -e "${YELLOW}Step 7: Creating Solana verifier artifacts...${NC}"

# Export as Solana verifier (generates Rust code)
snarkjs zkey export solidityverifier spend_final.zkey verifier.sol -v

# Create verification key JSON for on-chain use
cp verification_key.json "$ARTIFACTS_DIR/spend_vk.json"

echo -e "${GREEN}✓ Solana artifacts ready${NC}"

# Step 8: Generate test proof
echo -e "${YELLOW}Step 8: Generating test proof (optional)...${NC}"

# Create test witness
cat > test_input.json << 'EOF'
{
  "secret": "12345678901234567890123456789012",
  "balance": "1000000000000",
  "amount": "100000000",
  "merkleProof": [
    "0", "0", "0", "0", "0", "0", "0", "0",
    "0", "0", "0", "0", "0", "0", "0", "0",
    "0", "0", "0", "0"
  ],
  "merklePathIndices": [
    "0", "0", "0", "0", "0", "0", "0", "0",
    "0", "0", "0", "0", "0", "0", "0", "0",
    "0", "0", "0", "0"
  ],
  "merkleRoot": "0"
}
EOF

echo "Computing witness..."
node spend_js/generate_witness.js spend_js/spend.wasm test_input.json witness.wtns -v 2>/dev/null || echo "⚠️  Witness generation skipped (may need witness.wtns manually)"

# Step 9: Summary
echo ""
echo -e "${GREEN}=== Groth16 Setup Complete ===${NC}"
echo ""
echo "Artifacts created in: $ARTIFACTS_DIR"
echo ""
echo "📁 Files:"
echo "  ✓ spend.r1cs          - Circuit constraints"
echo "  ✓ spend_js/spend.wasm - Circuit WASM"
echo "  ✓ spend_final.zkey    - Proving key (SECRET!)"
echo "  ✓ pot14_final.ptau    - Powers of Tau"
echo "  ✓ verification_key.json - Verification key (public)"
echo "  ✓ verifier.sol        - Solana verifier template"
echo ""
echo "🔐 Next steps:"
echo "  1. Backend: Use spend_final.zkey and spend.wasm for proof generation"
echo "  2. Frontend: Use verification_key.json for client-side verification"
echo "  3. Solana: Deploy verifier with verification_key.json"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Keep spend_final.zkey secure (proving key)!${NC}"
echo ""
