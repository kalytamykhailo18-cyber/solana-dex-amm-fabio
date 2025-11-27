
# SolDEX - Simple Solana DEX MVP

A minimal decentralized exchange (DEX) with Automated Market Maker (AMM) built on Solana blockchain.

## Features

- Create liquidity pools for any SPL token pair
- Add and remove liquidity
- Swap tokens with constant product AMM (x * y = k)
- Configurable swap fees (0.1% - 10%)
- Wallet support: Phantom & Solflare
- Jupiter-ready architecture

## Project Structure

```
solana-dex-mvp/
├── .env                    # Centralized configuration
├── anchor/                 # On-chain program (Rust/Anchor)
│   ├── programs/dex/src/
│   │   ├── lib.rs          # Program entry point
│   │   ├── state.rs        # Account structures
│   │   ├── constants.rs    # Constants
│   │   ├── errors.rs       # Error definitions
│   │   └── instructions/   # Instruction handlers
│   └── tests/              # Integration tests
├── frontend/               # React web application
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   ├── config/         # Configuration
│   │   └── idl/            # Program IDL
│   └── public/
├── scripts/                # Deployment & utility scripts
└── docs/                   # Documentation
```

## Prerequisites

- [Rust](https://rustup.rs/) (latest stable)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) v1.18+
- [Anchor](https://www.anchor-lang.com/docs/installation) v0.30+
- [Node.js](https://nodejs.org/) v18+
- [Yarn](https://yarnpkg.com/) or npm

## Quick Start

### 1. Clone and Configure

```bash
# Clone the project
cd solana-dex-mvp

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
```

### 2. Setup Solana CLI

```bash
# Configure for devnet
solana config set --url devnet

# Generate keypair (if needed)
solana-keygen new --outfile ~/.config/solana/devnet.json

# Set as default
solana config set --keypair ~/.config/solana/devnet.json

# Get devnet SOL
solana airdrop 2
```

### 3. Build and Deploy Program

```bash
# Navigate to anchor directory
cd anchor

# Install dependencies
yarn install

# Build the program
anchor build

# Get program ID and update lib.rs and Anchor.toml
solana address -k target/deploy/dex-keypair.json

# Rebuild with correct ID
anchor build

# Deploy to devnet
anchor deploy

# Run tests
anchor test
```

### 4. Setup Frontend

```bash
# Navigate to frontend
cd frontend

# Install dependencies
yarn install

# Create .env file with your program ID
echo "VITE_PROGRAM_ID=<your-program-id>" > .env
echo "VITE_SOLANA_NETWORK=devnet" >> .env
echo "VITE_SOLANA_RPC_URL=https://api.devnet.solana.com" >> .env

# Start development server
yarn dev
```

### 5. Create Test Tokens (Optional)

```bash
cd scripts
yarn install
npx ts-node create-test-tokens.ts
```

## Usage

### Creating a Pool

1. Connect your wallet (Phantom or Solflare)
2. Navigate to "Create Pool"
3. Enter Token A and Token B mint addresses
4. Select fee rate
5. Click "Create Pool"

### Adding Liquidity

1. Select a pool
2. Navigate to "Liquidity"
3. Enter amounts for both tokens
4. Click "Add Liquidity"

### Swapping Tokens

1. Select a pool
2. Navigate to "Swap"
3. Enter input amount
4. Set slippage tolerance
5. Click "Swap"

## Configuration

All configuration is centralized in the `.env` file:

| Variable | Description | Default |
|----------|-------------|---------|
| `SOLANA_NETWORK` | Network (devnet/mainnet-beta) | devnet |
| `SOLANA_RPC_URL` | RPC endpoint | https://api.devnet.solana.com |
| `PROGRAM_ID` | Deployed program ID | - |
| `DEFAULT_SWAP_FEE_BPS` | Default swap fee (basis points) | 30 (0.3%) |
| `DEFAULT_SLIPPAGE_BPS` | Default slippage tolerance | 100 (1%) |

## Smart Contract

### Instructions

| Instruction | Description |
|-------------|-------------|
| `initialize_pool` | Create a new liquidity pool |
| `add_liquidity` | Add tokens to pool, receive LP tokens |
| `remove_liquidity` | Burn LP tokens, receive underlying tokens |
| `swap` | Exchange one token for another |

### AMM Formula

Uses constant product formula: `x * y = k`

```
amount_out = (reserve_out * amount_in * (1 - fee)) / (reserve_in + amount_in * (1 - fee))
```

## Fees

| Operation | Cost |
|-----------|------|
| Create Pool | ~0.02 SOL (rent) |
| Add Liquidity | ~0.0005 SOL |
| Remove Liquidity | ~0.0001 SOL |
| Swap | ~0.00005 SOL |

## Security Considerations

- Overflow protection with checked math
- Slippage protection
- PDA-based authority
- Reentrancy prevention

**Note:** This MVP has not been audited. Use with caution and small amounts initially.

## Deployment to Production

### 1. Switch to Mainnet

```bash
solana config set --url mainnet-beta
```

### 2. Update Configuration

Update `.env`:
```
SOLANA_NETWORK=mainnet-beta
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

### 3. Deploy Program

```bash
cd anchor
anchor deploy --provider.cluster mainnet
```

### 4. Deploy Frontend

```bash
cd frontend
yarn build

# Deploy to Vercel
npx vercel --prod

# Or Netlify
npx netlify deploy --prod --dir=dist
```

## License

MIT

## Support

For issues and questions, contact the developer.
