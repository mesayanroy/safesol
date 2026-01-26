#!/bin/bash

# ZK Circuit Build Script
# Compiles Circom circuits to WASM + R1CS

set -e

CIRCUIT_NAME=$1
PTAU_FILE="powersOfTau28_hez_final_14.ptau"

if [ -z "$CIRCUIT_NAME" ]; then
    echo "Usage: ./build_circuit.sh <circuit_name>"
    echo "Example: ./build_circuit.sh spend"
    exit 1
fi

echo "Building circuit: $CIRCUIT_NAME"

# Create output directory
mkdir -p ../build/$CIRCUIT_NAME

# Compile circuit
circom ../circuits/$CIRCUIT_NAME.circom \
    --r1cs \
    --wasm \
    --sym \
    -o ../build/$CIRCUIT_NAME

# Download powers of tau if not exists
if [ ! -f "../build/$PTAU_FILE" ]; then
    echo "Downloading powers of tau..."
    wget -P ../build/ https://hermez.s3-eu-west-1.amazonaws.com/$PTAU_FILE
fi

# Generate zkey
echo "Generating zkey..."
snarkjs groth16 setup \
    ../build/$CIRCUIT_NAME/$CIRCUIT_NAME.r1cs \
    ../build/$PTAU_FILE \
    ../build/$CIRCUIT_NAME/${CIRCUIT_NAME}_0000.zkey

# Contribute to phase 2 ceremony (for demo, use random beacon)
snarkjs zkey contribute \
    ../build/$CIRCUIT_NAME/${CIRCUIT_NAME}_0000.zkey \
    ../build/$CIRCUIT_NAME/${CIRCUIT_NAME}_final.zkey \
    --name="HackathonContribution" \
    -v -e="random entropy"

# Export verification key
snarkjs zkey export verificationkey \
    ../build/$CIRCUIT_NAME/${CIRCUIT_NAME}_final.zkey \
    ../build/$CIRCUIT_NAME/verification_key.json

echo "✓ Circuit built successfully!"
echo "WASM: build/$CIRCUIT_NAME/${CIRCUIT_NAME}_js/${CIRCUIT_NAME}.wasm"
echo "ZKEY: build/$CIRCUIT_NAME/${CIRCUIT_NAME}_final.zkey"
