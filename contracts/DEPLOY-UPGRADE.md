# Deploy Upgraded Contract to Testnet

## Status
✅ **Contract compiled successfully** with new view functions:
- `get_all_stakes()`
- `get_all_active_stakes()`
- `get_all_stakers()`
- `get_pool_stats()`
- `get_user_completed_challenges(address)`
- `get_user_challenges_count(address)`

## Current Issue
⚠️ **Rate limit exceeded** - The Aptos API has rate limits. Wait 5 minutes before retrying.

## Deployment Command

Once the rate limit resets, run:

```bash
cd contracts

# Set API key (to avoid rate limits)
export APTOS_API_KEY="aptoslabs_L5hFsF7bbq9_Hrx2cwhf16W75UppPqoedVNJcWrTPaUGx"

# Deploy upgraded contract
aptos move publish \
    --named-addresses dojohunt=0xca10b0176c34f9a8315589ff977645e04497814e9753d21f7d7e7c3d83aa7b57 \
    --private-key "ed25519-priv-0x5c41505f212316752c16ce58fb8e6b2e015ce3566d4bb417130e307c783f98b5" \
    --profile default \
    --assume-yes
```

## Alternative: Configure API Key in Aptos Config

1. Find your Aptos config file:
   - Windows: `%USERPROFILE%\.aptos\config.yaml`
   - Linux/Mac: `~/.aptos/config.yaml`

2. Add API key to the default profile:
```yaml
profiles:
  default:
    network: Testnet
    rest_url: https://api.testnet.aptoslabs.com
    api_key: "aptoslabs_L5hFsF7bbq9_Hrx2cwhf16W75UppPqoedVNJcWrTPaUGx"
    # ... other config
```

3. Then run:
```bash
cd contracts
aptos move publish \
    --named-addresses dojohunt=0xca10b0176c34f9a8315589ff977645e04497814e9753d21f7d7e7c3d83aa7b57 \
    --private-key "ed25519-priv-0x5c41505f212316752c16ce58fb8e6b2e015ce3566d4bb417130e307c783f98b5" \
    --profile default \
    --assume-yes
```

## What Happens After Deployment

The upgraded contract will be published at the same address:
- **Module Address**: `0xca10b0176c34f9a8315589ff977645e04497814e9753d21f7d7e7c3d83aa7b57`

**Note**: In Aptos, modules are immutable. Publishing with the same address will create a new package version. Existing data (stakes, completions) will be preserved.

## Verify Deployment

After deployment, test the new view functions:

```bash
# Get pool stats
aptos move view \
    --function-id 0xca10b0176c34f9a8315589ff977645e04497814e9753d21f7d7e7c3d83aa7b57::dojohunt_staking::get_pool_stats \
    --profile default

# Get all active stakes
aptos move view \
    --function-id 0xca10b0176c34f9a8315589ff977645e04497814e9753d21f7d7e7c3d83aa7b57::dojohunt_staking::get_all_active_stakes \
    --profile default
```

## Next Steps

1. Wait 5 minutes for rate limit to reset
2. Run the deployment command above
3. Update API endpoint (`/api/staking/view-functions/route.ts`) to handle new `StakeInfo` struct format
4. Test the view functions from the frontend

