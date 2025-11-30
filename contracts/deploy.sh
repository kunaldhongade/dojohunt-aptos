#!/bin/bash

# DojoHunt Contract Deployment Script for Testnet
# This script deploys both token and staking contracts to Aptos testnet

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting DojoHunt Contract Deployment to Testnet${NC}"

# Check if private key is provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: Private key not provided${NC}"
    echo "Usage: ./deploy.sh <private-key>"
    exit 1
fi

PRIVATE_KEY="$1"

# Extract account address from private key
echo -e "${YELLOW}📝 Extracting account address from private key...${NC}"
ACCOUNT_ADDRESS=$(aptos key extract-peer --private-key "$PRIVATE_KEY" --output json 2>/dev/null | grep -o '"account": "[^"]*"' | cut -d'"' -f4 || echo "")

if [ -z "$ACCOUNT_ADDRESS" ]; then
    echo -e "${YELLOW}⚠️  Could not extract address automatically. Will use private key directly.${NC}"
    # Try to get address from aptos init
    ACCOUNT_ADDRESS=$(aptos init --network testnet --private-key "$PRIVATE_KEY" --assume-yes 2>&1 | grep -o '0x[a-fA-F0-9]\{64\}' | head -1 || echo "")
fi

if [ -z "$ACCOUNT_ADDRESS" ]; then
    echo -e "${RED}❌ Could not determine account address. Please check your private key.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Account Address: ${ACCOUNT_ADDRESS}${NC}"

# Update Move.toml with account address
echo -e "${YELLOW}📝 Updating Move.toml with account address...${NC}"
sed -i.bak "s/dojohunt = \"_\"/dojohunt = \"${ACCOUNT_ADDRESS}\"/" Move.toml

# Compile contracts
echo -e "${YELLOW}🔨 Compiling contracts...${NC}"
aptos move compile --named-addresses dojohunt="$ACCOUNT_ADDRESS" || {
    echo -e "${RED}❌ Compilation failed${NC}"
    exit 1
}

echo -e "${GREEN}✅ Compilation successful${NC}"

# Deploy token contract
echo -e "${YELLOW}📦 Deploying token contract...${NC}"
aptos move publish \
    --named-addresses dojohunt="$ACCOUNT_ADDRESS" \
    --private-key "$PRIVATE_KEY" \
    --network testnet \
    --assume-yes || {
    echo -e "${RED}❌ Token contract deployment failed${NC}"
    exit 1
}

echo -e "${GREEN}✅ Token contract deployed${NC}"

# Initialize token
echo -e "${YELLOW}🔧 Initializing token...${NC}"
aptos move run \
    --function-id "${ACCOUNT_ADDRESS}::dojohunt_token::init_module" \
    --args string:"TSKULL Token" string:"TSKULL" u8:8 string:"https://dojohunt.com/logo.png" string:"https://dojohunt.com" string:"TSKULL token for DojoHunt platform" \
    --private-key "$PRIVATE_KEY" \
    --network testnet \
    --assume-yes || {
    echo -e "${RED}❌ Token initialization failed${NC}"
    exit 1
}

echo -e "${GREEN}✅ Token initialized${NC}"

# Deploy staking contract
echo -e "${YELLOW}📦 Deploying staking contract...${NC}"
aptos move publish \
    --named-addresses dojohunt="$ACCOUNT_ADDRESS" \
    --private-key "$PRIVATE_KEY" \
    --network testnet \
    --assume-yes || {
    echo -e "${RED}❌ Staking contract deployment failed${NC}"
    exit 1
}

echo -e "${GREEN}✅ Staking contract deployed${NC}"

# Initialize staking
echo -e "${YELLOW}🔧 Initializing staking contract...${NC}"
aptos move run \
    --function-id "${ACCOUNT_ADDRESS}::dojohunt_staking::init_module" \
    --private-key "$PRIVATE_KEY" \
    --network testnet \
    --assume-yes || {
    echo -e "${RED}❌ Staking initialization failed${NC}"
    exit 1
}

echo -e "${GREEN}✅ Staking contract initialized${NC}"

# Restore Move.toml backup
if [ -f "Move.toml.bak" ]; then
    mv Move.toml.bak Move.toml
fi

echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo -e "${YELLOW}📋 Contract Addresses:${NC}"
echo -e "Token Module:   ${ACCOUNT_ADDRESS}"
echo -e "Staking Module: ${ACCOUNT_ADDRESS}"
echo ""
echo -e "${YELLOW}📝 Update your .env file with:${NC}"
echo "NEXT_PUBLIC_STAKING_MODULE_ADDRESS=\"${ACCOUNT_ADDRESS}\""
echo "NEXT_PUBLIC_TOKEN_MODULE_ADDRESS=\"${ACCOUNT_ADDRESS}\""
echo ""

