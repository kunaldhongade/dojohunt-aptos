# DojoHunt Contract Deployment Guide

Based on [Aptos create-aptos-dapp](https://github.com/aptos-labs/create-aptos-dapp) best practices.

## Quick Start

### Deploy to Testnet (New Deployment)

```bash
cd contracts
npm run deploy:testnet
```

### Upgrade Existing Contract

```bash
cd contracts
npm run deploy:upgrade
```

## Prerequisites

1. **Aptos CLI** installed: https://aptos.dev/tools/aptos-cli/install-cli/
2. **Private Key** in `.env`:
   ```env
   TOKEN_OWNER_PRIVATE_KEY="ed25519-priv-0x..."
   ```
3. **API Key** (optional but recommended to avoid rate limits):
   ```env
   APTOS_API_KEY="aptoslabs_..."
   ```
4. **Module Address** (for upgrades):
   ```env
   NEXT_PUBLIC_STAKING_MODULE_ADDRESS="0x..."
   ```

## Deployment Methods

### Method 1: Using npm Scripts (Recommended)

```bash
# Deploy to testnet
npm run deploy:testnet

# Deploy to mainnet
npm run deploy:mainnet

# Upgrade existing contract
npm run deploy:upgrade
```

### Method 2: Using Node.js Script Directly

```bash
# Deploy to testnet
node scripts/deploy.js --network testnet

# Upgrade existing contract
node scripts/deploy.js --network testnet --upgrade
```

### Method 3: Using Bash Scripts

```bash
# Simple deployment
bash deploy-simple.sh

# Full deployment with initialization
bash deploy.sh <private-key>

# Upgrade deployment
bash deploy-upgrade.sh
```

### Method 4: Using Aptos CLI Directly

```bash
# Compile
aptos move compile --named-addresses dojohunt=0xca10b0176c34f9a8315589ff977645e04497814e9753d21f7d7e7c3d83aa7b57

# Publish
aptos move publish \
  --named-addresses dojohunt=0xca10b0176c34f9a8315589ff977645e04497814e9753d21f7d7e7c3d83aa7b57 \
  --private-key "ed25519-priv-0x..." \
  --profile default \
  --assume-yes
```

## Understanding Aptos Module Upgrades

In Aptos, **modules are immutable** once published. However, you can:

1. **Publish a new package version** at the same address (if you own the account)
2. **Create a new package** at a different address

When you publish with `--named-addresses dojohunt=0x...` using the same address:
- ✅ Creates a new package version
- ✅ Existing data (stakes, completions) is preserved
- ✅ New functions become available
- ⚠️ Old functions remain accessible (backward compatible)

## What's New in This Upgrade

The upgraded contract includes new **view functions**:

1. **`get_all_stakes()`** - Returns all stakes (active + inactive)
2. **`get_all_active_stakes()`** - Returns only active stakes  
3. **`get_all_stakers()`** - Returns all wallet addresses with stakes
4. **`get_pool_stats()`** - Returns pool statistics (total staked, fees, stakers)
5. **`get_user_completed_challenges(address)`** - Returns user's completed challenge IDs
6. **`get_user_challenges_count(address)`** - Returns count of completed challenges

## Troubleshooting

### Rate Limit Exceeded

If you see: `Per anonymous IP rate limit exceeded`

**Solution:**
1. Wait 5 minutes for rate limit to reset
2. Add `APTOS_API_KEY` to `.env`:
   ```env
   APTOS_API_KEY="aptoslabs_..."
   ```
3. Retry deployment

### Module Already Exists

If you see: `Module already exists`

**Solution:**
- This is normal for upgrades
- The new version will be published
- Existing data is preserved

### Compilation Errors

**Solution:**
```bash
# Clean build
rm -rf build/

# Recompile
npm run compile
```

## Post-Deployment

After successful deployment:

1. **Update `.env`** (if new deployment):
   ```env
   NEXT_PUBLIC_STAKING_MODULE_ADDRESS="0x..."
   NEXT_PUBLIC_TOKEN_MODULE_ADDRESS="0x..."
   ```

2. **Verify deployment**:
   ```bash
   # View pool stats
   aptos move view \
     --function-id 0x...::dojohunt_staking::get_pool_stats \
     --profile default
   ```

3. **Test view functions** via API:
   ```bash
   curl "http://localhost:3000/api/staking/view-functions?function=get_pool_stats"
   ```

## References

- [Aptos create-aptos-dapp](https://github.com/aptos-labs/create-aptos-dapp)
- [Aptos CLI Documentation](https://aptos.dev/tools/aptos-cli/)
- [Move Language Documentation](https://aptos.dev/move/move-on-aptos/)

