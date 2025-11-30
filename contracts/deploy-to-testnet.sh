#!/bin/bash

# Deploy DojoHunt Contracts to Aptos Testnet
# Usage: ./deploy-to-testnet.sh

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Deploying DojoHunt Contracts to Aptos Testnet${NC}"

# Get private key from .env (first 64 chars after ed25519-priv-)
PRIVATE_KEY="ed25519-priv-0x5c41505f212316752c16ce58fb8e6b2e015ce3566d4bb417130e307c783f98b5"

if [ -z "$PRIVATE_KEY" ]; then
    echo -e "${RED}❌ Error: Private key not found${NC}"
    exit 1
fi

echo -e "${YELLOW}📝 Using private key: ${PRIVATE_KEY:0:30}...${NC}"

# Extract account address (we'll get it from the deployment)
echo -e "${YELLOW}📦 Publishing contracts...${NC}"

# Compile first
echo -e "${YELLOW}🔨 Compiling contracts...${NC}"
aptos move compile --named-addresses dojohunt=0x0 --skip-fetch-latest-git-deps || {
    echo -e "${RED}❌ Compilation failed${NC}"
    exit 1
}

# Get the account address from the private key by creating a test transaction
# Actually, we'll get it from the publish output
echo -e "${YELLOW}📤 Publishing to testnet...${NC}"

# Publish both contracts together
OUTPUT=$(aptos move publish \
    --named-addresses dojohunt=0x0 \
    --private-key "$PRIVATE_KEY" \
    --network testnet \
    --assume-yes 2>&1)

echo "$OUTPUT"

# Extract account address from output
ACCOUNT_ADDRESS=$(echo "$OUTPUT" | grep -oE "0x[a-fA-F0-9]{64}" | head -1)

if [ -z "$ACCOUNT_ADDRESS" ]; then
    echo -e "${YELLOW}⚠️  Could not extract account address from output. Please check manually.${NC}"
    echo -e "${YELLOW}Look for the account address in the transaction output above.${NC}"
else
    echo -e "${GREEN}✅ Contracts published!${NC}"
    echo -e "${GREEN}📋 Account Address: ${ACCOUNT_ADDRESS}${NC}"
    
    echo ""
    echo -e "${YELLOW}📝 Next steps:${NC}"
    echo "1. Initialize token contract:"
    echo "   aptos move run --function-id ${ACCOUNT_ADDRESS}::dojohunt_token::initialize_token --args string:\"TSKULL Token\" string:\"TSKULL\" u8:8 string:\"https://dojohunt.com/logo.png\" string:\"https://dojohunt.com\" string:\"TSKULL token for DojoHunt platform\" --private-key \"$PRIVATE_KEY\" --network testnet --assume-yes"
    echo ""
    echo "2. Setup staking resource account:"
    echo "   aptos move run --function-id ${ACCOUNT_ADDRESS}::dojohunt_staking::setup_resource_account --private-key \"$PRIVATE_KEY\" --network testnet --assume-yes"
    echo ""
    echo "3. Initialize staking contract:"
    echo "   aptos move run --function-id ${ACCOUNT_ADDRESS}::dojohunt_staking::init_module --private-key \"$PRIVATE_KEY\" --network testnet --assume-yes"
    echo ""
    echo -e "${YELLOW}📝 Update your .env file:${NC}"
    echo "NEXT_PUBLIC_STAKING_MODULE_ADDRESS=\"${ACCOUNT_ADDRESS}\""
    echo "NEXT_PUBLIC_TOKEN_MODULE_ADDRESS=\"${ACCOUNT_ADDRESS}\""
fi

