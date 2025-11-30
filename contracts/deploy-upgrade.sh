#!/bin/bash

# Deploy upgraded DojoHunt Contracts to Aptos Testnet
# This upgrades the existing contract at the same address

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Upgrading DojoHunt Contracts on Aptos Testnet${NC}"

# Get private key and API key from .env
PRIVATE_KEY="ed25519-priv-0x5c41505f212316752c16ce58fb8e6b2e015ce3566d4bb417130e307c783f98b5"
API_KEY="aptoslabs_L5hFsF7bbq9_Hrx2cwhf16W75UppPqoedVNJcWrTPaUGx"
MODULE_ADDRESS="0xca10b0176c34f9a8315589ff977645e04497814e9753d21f7d7e7c3d83aa7b57"

if [ -z "$PRIVATE_KEY" ]; then
    echo -e "${RED}❌ Error: Private key not found${NC}"
    exit 1
fi

echo -e "${YELLOW}📝 Module Address: ${MODULE_ADDRESS}${NC}"
echo -e "${YELLOW}📝 Using API key: ${API_KEY:0:20}...${NC}"

# Set API key in environment
export APTOS_API_KEY="$API_KEY"

# Compile first
echo -e "${YELLOW}🔨 Compiling contracts...${NC}"
aptos move compile --named-addresses dojohunt=$MODULE_ADDRESS --skip-fetch-latest-git-deps || {
    echo -e "${RED}❌ Compilation failed${NC}"
    exit 1
}

echo -e "${YELLOW}📤 Publishing upgraded contract to testnet...${NC}"
echo -e "${YELLOW}⏳ This may take a few minutes...${NC}"

# Publish with API key in header
OUTPUT=$(aptos move publish \
    --named-addresses dojohunt=$MODULE_ADDRESS \
    --private-key "$PRIVATE_KEY" \
    --profile default \
    --assume-yes 2>&1)

echo "$OUTPUT"

# Check if successful
if echo "$OUTPUT" | grep -q "Success"; then
    echo -e "${GREEN}✅ Contract upgraded successfully!${NC}"
    echo -e "${GREEN}📋 Module Address: ${MODULE_ADDRESS}${NC}"
    echo ""
    echo -e "${YELLOW}📝 New view functions available:${NC}"
    echo "  - get_all_stakes()"
    echo "  - get_all_active_stakes()"
    echo "  - get_all_stakers()"
    echo "  - get_pool_stats()"
    echo "  - get_user_completed_challenges(address)"
    echo "  - get_user_challenges_count(address)"
else
    echo -e "${RED}❌ Deployment failed. Check output above.${NC}"
    exit 1
fi

