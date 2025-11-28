# DojoHunt Aptos Contracts

This directory contains Move smart contracts for the DojoHunt platform.

## Prerequisites

1. Install Aptos CLI: https://aptos.dev/tools/aptos-cli/install-cli/
2. Create an Aptos account and fund it with testnet tokens (for testnet deployment)

## Project Structure

```
contracts/
├── Move.toml          # Move package configuration
└── sources/
    ├── dojohunt_token.move    # Token contract
    └── dojohunt_staking.move  # Staking contract
```

## Setup

1. Install Aptos CLI dependencies
2. Set your account address in `Move.toml`:
   ```toml
   [addresses]
   dojohunt = "YOUR_ACCOUNT_ADDRESS"
   ```

## Compile

```bash
aptos move compile
```

## Test

```bash
aptos move test
```

## Deploy

### Testnet

```bash
# Set your private key
export APTOS_PRIVATE_KEY=your_private_key_here

# Deploy token contract
aptos move publish --named-addresses dojohunt=YOUR_ACCOUNT_ADDRESS --profile testnet

# Initialize token (after deployment)
aptos move run \
  --function-id YOUR_ACCOUNT_ADDRESS::dojohunt_token::init_module \
  --args string:"DojoHunt Token" string:"DOJO" u8:8 string:"https://..." string:"https://..." string:"Token description" \
  --profile testnet

# Deploy staking contract
aptos move publish --named-addresses dojohunt=YOUR_ACCOUNT_ADDRESS --profile testnet

# Initialize staking (after deployment)
aptos move run \
  --function-id YOUR_ACCOUNT_ADDRESS::dojohunt_staking::init_module \
  --profile testnet
```

### Mainnet

Replace `--profile testnet` with `--profile mainnet` and ensure you have sufficient APT.

## Environment Variables

After deployment, update your `.env` file:

```
NEXT_PUBLIC_APTOS_NETWORK=testnet
NEXT_PUBLIC_STAKING_MODULE_ADDRESS=0x...
NEXT_PUBLIC_TOKEN_MODULE_ADDRESS=0x...
```

## Contract Addresses

- **Token Module**: Deployed at your account address
- **Staking Module**: Deployed at your account address

Both modules use the same account address (the `dojohunt` named address).
