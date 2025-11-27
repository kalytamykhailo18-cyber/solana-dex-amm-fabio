# Deployment Guide

This guide covers deploying the Solana DEX MVP to both testnet and mainnet.

## Prerequisites

Before deploying, ensure you have:
- Solana CLI installed and configured
- Anchor framework installed
- Node.js 18+ installed
- A funded wallet (devnet: free airdrop, mainnet: real SOL)

## Devnet Deployment

### Step 1: Configure Solana CLI

```bash
# Set to devnet
solana config set --url devnet

# Generate a new keypair (if needed)
solana-keygen new --outfile ~/.config/solana/devnet.json

# Set as default keypair
solana config set --keypair ~/.config/solana/devnet.json

# Get devnet SOL (free)
solana airdrop 2
solana airdrop 2  # Can request multiple times

# Verify configuration
solana config get
solana balance
```

### Step 2: Build the Program

```bash
cd anchor

# Install dependencies
yarn install

# Build
anchor build

# Get the generated program ID
solana address -k target/deploy/dex-keypair.json
# Example output: DexProgramABC123...
```

### Step 3: Update Program ID

Update the program ID in two files:

**anchor/programs/dex/src/lib.rs:**
```rust
declare_id!("DexProgramABC123...");  // Your program ID
```

**anchor/Anchor.toml:**
```toml
[programs.devnet]
dex = "DexProgramABC123..."
```

### Step 4: Rebuild and Deploy

```bash
# Rebuild with correct program ID
anchor build

# Deploy
anchor deploy

# Verify deployment
solana program show <PROGRAM_ID>
```

### Step 5: Update Environment

Update the root `.env` file:
```
PROGRAM_ID=DexProgramABC123...
VITE_PROGRAM_ID=DexProgramABC123...
```

### Step 6: Run Tests

```bash
cd anchor
anchor test
```

### Step 7: Deploy Frontend

```bash
cd frontend

# Copy environment file
cp .env.example .env

# Update with your program ID
# Edit .env: VITE_PROGRAM_ID=DexProgramABC123...

# Install dependencies
yarn install

# Build
yarn build

# Preview locally
yarn preview

# Deploy to Vercel (recommended)
npx vercel --prod

# Or deploy to Netlify
npx netlify deploy --prod --dir=dist
```

---

## Mainnet Deployment

### Important Considerations

1. **Cost**: Mainnet deployment costs real SOL (~2-3 SOL for program deployment)
2. **No Audit**: This MVP has not been audited - use at your own risk
3. **Testing**: Thoroughly test on devnet first
4. **Gradual Rollout**: Start with small amounts

### Step 1: Configure for Mainnet

```bash
# Set to mainnet
solana config set --url mainnet-beta

# Use a secure keypair
solana config set --keypair ~/.config/solana/mainnet.json

# Check balance (need ~3 SOL for deployment + operations)
solana balance
```

### Step 2: Update Configuration

Update `anchor/Anchor.toml`:
```toml
[provider]
cluster = "mainnet"
wallet = "~/.config/solana/mainnet.json"

[programs.mainnet]
dex = "11111111111111111111111111111111"  # Will be updated
```

Update `.env`:
```
SOLANA_NETWORK=mainnet-beta
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

### Step 3: Build and Deploy

```bash
cd anchor

# Build
anchor build

# Get program ID
solana address -k target/deploy/dex-keypair.json

# Update lib.rs and Anchor.toml with new program ID
# Then rebuild
anchor build

# Deploy to mainnet
anchor deploy --provider.cluster mainnet

# Verify
solana program show <PROGRAM_ID>
```

### Step 4: Deploy Frontend for Mainnet

```bash
cd frontend

# Update .env for mainnet
VITE_SOLANA_NETWORK=mainnet-beta
VITE_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
VITE_PROGRAM_ID=<MAINNET_PROGRAM_ID>

# Build
yarn build

# Deploy
npx vercel --prod
```

---

## Using Custom RPC

For production, consider using a premium RPC provider:

### Helius
```
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
```

### QuickNode
```
SOLANA_RPC_URL=https://YOUR_ENDPOINT.solana-mainnet.quiknode.pro/YOUR_KEY/
```

### Alchemy
```
SOLANA_RPC_URL=https://solana-mainnet.g.alchemy.com/v2/YOUR_KEY
```

---

## Hosting Options

### Vercel (Recommended)
- Free tier available
- Automatic deployments from Git
- Easy custom domain setup

```bash
npm i -g vercel
vercel --prod
```

### Netlify
- Free tier available
- Form handling included

```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

### Cloudflare Pages
- Free tier with generous limits
- Global CDN

```bash
npm i -g wrangler
wrangler pages deploy dist
```

---

## Post-Deployment Checklist

- [ ] Program deployed and verified
- [ ] Frontend deployed and accessible
- [ ] Wallet connection working (Phantom + Solflare)
- [ ] Pool creation working
- [ ] Add liquidity working
- [ ] Swap working
- [ ] Remove liquidity working
- [ ] All transactions confirming properly
- [ ] Error messages displaying correctly

---

## Monitoring

### Solana Explorer
View program and transactions:
- Devnet: https://explorer.solana.com/?cluster=devnet
- Mainnet: https://explorer.solana.com/

### Solscan
Alternative explorer with more details:
- https://solscan.io/

---

## Upgrading the Program

Anchor programs are upgradeable by default. To upgrade:

```bash
# Make changes to the program
# Rebuild
anchor build

# Upgrade (keeps same program ID)
anchor upgrade target/deploy/dex.so --program-id <PROGRAM_ID>
```

To make the program immutable (cannot be upgraded):
```bash
solana program set-upgrade-authority <PROGRAM_ID> --final
```

---

## Troubleshooting

### "Insufficient funds"
- Check wallet balance: `solana balance`
- For devnet, request airdrop: `solana airdrop 2`

### "Program failed to complete"
- Check compute units in transaction
- May need to increase priority fee

### "Account not found"
- Pool may not exist
- Check token mint addresses are correct

### "Custom program error"
- Check error code against `errors.rs`
- 6000: Invalid fee rate
- 6001: Insufficient liquidity
- 6002: Slippage exceeded
- 6005: Zero amount

### Frontend connection issues
- Check RPC URL in .env
- Verify program ID is correct
- Try clearing browser cache
