#!/bin/bash

# Simple deployment script for DojoHunt contracts
# Usage: ./deploy-simple.sh <private-key>

set -e

PRIVATE_KEY="${1:-ed25519-priv-0x5c41505f212316752c16ce58fb8e6b2e015ce3566d4bb417130e307c783f98b5}"

echo "🔨 Compiling contracts..."
aptos move compile --named-addresses dojohunt=0x0

echo ""
echo "📦 Deploying contracts to testnet..."
echo "Using private key: ${PRIVATE_KEY:0:20}..."

# First, we need to get the account address
# Let's try to publish and see what address it uses
echo ""
echo "🚀 Publishing contracts..."

# Publish both modules together
aptos move publish \
    --named-addresses dojohunt=0x0 \
    --private-key "$PRIVATE_KEY" \
    --network testnet \
    --assume-yes

echo ""
echo "✅ Contracts published!"
echo ""
echo "📝 Next steps:"
echo "1. Check the transaction output for the account address"
echo "2. Initialize the token module"
echo "3. Initialize the staking module"
echo "4. Update .env with the addresses"

