# Deployment Guide for DojoHunt Contracts

## Prerequisites

1. Aptos CLI installed (version 7.7.0+)
2. Private key for deployment account
3. Account funded with testnet APT (for gas fees)

## Current Status

⚠️ **Note**: The contracts have compilation issues with coin transfers from module accounts. This needs to be fixed before deployment.

## Deployment Steps (Once Contracts Compile)

### 1. Extract Account Address from Private Key

```bash
# The private key from .env
PRIVATE_KEY="ed25519-priv-0x5c41505f212316752c16ce58fb8e6b2e015ce3566d4bb417130e307c783f98b5"

# Get account address (you may need to use Aptos SDK or CLI)
```

### 2. Update Move.toml

```bash
cd contracts
# Replace YOUR_ACCOUNT_ADDRESS with the actual address
sed -i 's/dojohunt = "_"/dojohunt = "YOUR_ACCOUNT_ADDRESS"/' Move.toml
```

### 3. Compile Contracts

```bash
aptos move compile --named-addresses dojohunt=YOUR_ACCOUNT_ADDRESS --skip-fetch-latest-git-deps
```

### 4. Deploy to Testnet

```bash
# Deploy both contracts
aptos move publish \
    --named-addresses dojohunt=YOUR_ACCOUNT_ADDRESS \
    --private-key "$PRIVATE_KEY" \
    --network testnet \
    --assume-yes
```

### 5. Initialize Token Contract

```bash
aptos move run \
    --function-id YOUR_ACCOUNT_ADDRESS::dojohunt_token::init_module \
    --args string:"TSKULL Token" string:"TSKULL" u8:8 string:"https://dojohunt.com/logo.png" string:"https://dojohunt.com" string:"TSKULL token for DojoHunt platform" \
    --private-key "$PRIVATE_KEY" \
    --network testnet \
    --assume-yes
```

### 6. Initialize Staking Contract

```bash
aptos move run \
    --function-id YOUR_ACCOUNT_ADDRESS::dojohunt_staking::init_module \
    --private-key "$PRIVATE_KEY" \
    --network testnet \
    --assume-yes
```

### 7. Update .env File

After successful deployment, update your `.env` file:

```env
NEXT_PUBLIC_STAKING_MODULE_ADDRESS="YOUR_ACCOUNT_ADDRESS"
NEXT_PUBLIC_TOKEN_MODULE_ADDRESS="YOUR_ACCOUNT_ADDRESS"
```

## Known Issues

1. **Coin Transfer Issue**: The `unstake` function tries to transfer coins from `@dojohunt` module address to user, but this requires a signer which we don't have. This needs to be fixed using:
   - Resource account pattern, OR
   - Restructuring to use deployer account for holding coins

## Next Steps

1. Fix the coin transfer issue in the staking contract
2. Recompile and test locally
3. Deploy to testnet
4. Test staking/unstaking functionality
5. Deploy to mainnet (when ready)

