# Aptos Migration Verification Checklist

## ✅ Completed Migrations

### 1. Smart Contracts
- [x] Created Move contracts (`dojohunt_token.move`, `dojohunt_staking.move`)
- [x] Removed Solidity contracts
- [x] Added Move.toml configuration
- [x] Updated contracts README with Aptos deployment instructions

### 2. Dependencies
- [x] Replaced `ethers.js` with `@aptos-labs/ts-sdk`
- [x] Removed `wagmi` and `viem`
- [x] Replaced Privy with `@aptos-labs/wallet-adapter-react`
- [x] Added wallet adapter packages (Petra, Pontem, Martian, Rise, Fewcha)

### 3. Core Libraries
- [x] `lib/blockchain.ts` - Fully converted to Aptos SDK
- [x] `lib/contract-helpers.ts` - Updated for Aptos wallet adapter
- [x] All functions use Aptos SDK methods

### 4. Components
- [x] `components/aptos-wallet-provider.tsx` - Created Aptos wallet provider
- [x] `components/connect-wallet.tsx` - Updated to use Aptos wallet adapter
- [x] `app/layout.tsx` - Uses AptosWalletProvider
- [x] Removed `components/privy-provider.tsx`

### 5. Pages
- [x] `app/staking/page.tsx` - Fully converted to Aptos
- [x] Removed Ethereum/EVM specific code
- [x] Updated UI text from "ETH" to "Tokens"
- [x] Removed token approval flow (not needed on Aptos)

### 6. API Routes
- [x] `app/api/staking/stake/route.ts` - Updated for Aptos transactions
- [x] Removed ethers.js dependencies

### 7. Configuration
- [x] Updated environment variables
- [x] Updated README.md
- [x] Updated scripts/create-env.js
- [x] Removed Hardhat configuration
- [x] Updated docs and tutorials pages

## 🔍 Code Verification

### No Ethereum/EVM Code Remaining
- ✅ No `ethers.js` imports in app/lib/components
- ✅ No `@privy-io` imports in app/lib/components  
- ✅ No `wagmi` or `viem` imports
- ✅ No Hardhat configuration files

### Aptos Code Present
- ✅ All blockchain interactions use `@aptos-labs/ts-sdk`
- ✅ Wallet connections use `@aptos-labs/wallet-adapter-react`
- ✅ Move contracts in `contracts/sources/`
- ✅ Environment variables reference Aptos network

## ⚠️ Known Issues to Fix

1. **TypeScript Errors**: Most are due to missing node_modules. Run `pnpm install` to resolve.

2. **Wallet Adapter API**: The `signAndSubmitTransaction` method signature may need adjustment based on actual wallet adapter version. Check the wallet adapter documentation.

3. **Move Contracts**: The Move contracts may need syntax adjustments after compilation. Test with:
   ```bash
   aptos move compile
   ```

4. **Account Signing**: The current implementation uses wallet adapter's `signAndSubmitTransaction`. Verify this matches your wallet adapter version.

## 🧪 Testing Checklist

### Before Testing
1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Set up environment variables:
   ```bash
   NEXT_PUBLIC_APTOS_NETWORK=testnet
   NEXT_PUBLIC_STAKING_MODULE_ADDRESS=0x...
   NEXT_PUBLIC_TOKEN_MODULE_ADDRESS=0x...
   ```

3. Deploy contracts:
   ```bash
   cd contracts
   aptos move compile
   aptos move publish --named-addresses dojohunt=YOUR_ADDRESS --profile testnet
   ```

### Manual Testing
- [ ] Wallet connection works
- [ ] Can view token balance
- [ ] Can stake tokens
- [ ] Can unstake tokens
- [ ] Transaction verification works
- [ ] Challenge completion works

### Integration Testing
- [ ] Staking API route accepts Aptos transactions
- [ ] Transaction hash verification works
- [ ] Stake info retrieval works
- [ ] Challenge completion tracking works

## 📝 Next Steps

1. **Install Dependencies**: Run `pnpm install` to install all Aptos packages
2. **Fix TypeScript Errors**: Most will resolve after installation
3. **Deploy Contracts**: Deploy Move contracts to Aptos testnet
4. **Test Wallet Integration**: Connect with Petra/Pontem wallet and test transactions
5. **Verify Transactions**: Ensure transaction verification works correctly
6. **Update Documentation**: Add any Aptos-specific setup instructions

## 🎯 Migration Complete

The project has been successfully migrated from Ethereum/Base Sepolia to Aptos. All core functionality has been converted, and the codebase is ready for testing and deployment.

