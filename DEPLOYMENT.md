# DexSpeed Deployment Guide

## Complete Step-by-Step Deployment Instructions

This guide shows EXACTLY how to deploy the DEX based on what actually works.

---

## Part 1: Setup Phantom Wallet for Devnet

### 1. Install Phantom Wallet
- Go to https://phantom.app/download
- Install browser extension
- Create or import wallet

### 2. Enable Devnet
- Open Phantom
- Click Settings (⚙️)
- Enable "Developer Settings" or "Testnet Mode"
- Click network dropdown at top
- Select "Devnet"

### 3. Get Test SOL
**Option A: Phantom Built-in**
- Click "Receive" or faucet icon
- Click "Airdrop"

**Option B: Command Line**
```bash
solana airdrop 2
```

**Option C: Web Faucet**
- Go to https://faucet.solana.com/
- Paste your address
- Request airdrop

You need at least 2 SOL (test tokens, FREE)

---

## Part 2: Export Phantom Private Key

**ONLY DO THIS FOR DEVNET WALLET!**

1. Open Phantom wallet
2. Click Settings (⚙️)
3. Click "Export Private Key"
4. Enter your password
5. Copy the private key (long string)

Example: `4UNqvpAFfUUjo7h2madWKH9XhfHFkeqcncKDdCtA21vk...`

---

## Part 3: Setup Wallet Keypair File

### Convert Phantom private key to keypair file:

```bash
# Create config directory
mkdir -p ~/.config/solana

# Run this Python script to convert
python3 << 'EOF'
ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"

def b58decode(s):
    num = 0
    for char in s:
        num = num * 58 + ALPHABET.index(char)
    result = []
    while num > 0:
        result.insert(0, num % 256)
        num //= 256
    for char in s:
        if char == '1':
            result.insert(0, 0)
        else:
            break
    return bytes(result)

# REPLACE WITH YOUR PRIVATE KEY
private_key = "YOUR_PHANTOM_PRIVATE_KEY_HERE"

decoded = b58decode(private_key)
import json
with open('/home/a/.config/solana/id.json', 'w') as f:
    json.dump(list(decoded), f)
print("Keypair created!")
EOF
```

### Verify it worked:

```bash
solana address -k ~/.config/solana/id.json
```

Should show your Phantom wallet address.

---

## Part 4: Configure Solana CLI

```bash
# Set network to devnet
solana config set --url devnet

# Verify configuration
solana config get

# Check balance
solana balance
```

You should see your test SOL balance.

---

## Part 5: Configure Anchor.toml

The file should look like this:

```toml
[toolchain]
anchor_version = "0.30.1"

[features]
resolution = true
skip-lint = false

[programs.devnet]
dex = { address = "EZDyb8s4DgMksN6aPx7gbeZ8B7SjWms3YuXu3VgUT11T", path = "programs/dex" }

[programs.mainnet]
dex = { address = "EZDyb8s4DgMksN6aPx7gbeZ8B7SjWms3YuXu3VgUT11T", path = "programs/dex" }

[registry]
url = "https://api.apr.dev"

[workspace]
members = ["programs/*"]

[provider]
cluster = "Devnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
```

**Important:** The `address` and `path` fields are REQUIRED for Anchor 0.30.1

---

## Part 6: Build the Program

```bash
cd anchor
anchor build
```

This creates:
- `target/deploy/dex.so` - Your compiled program
- `target/deploy/dex-keypair.json` - Program keypair

---

## Part 7: Deploy to Devnet

### Method 1: Using Solana CLI (RECOMMENDED - This Works!)

```bash
solana program deploy target/deploy/dex.so \
  --program-id target/deploy/dex-keypair.json \
  --max-len 350000
```

**What happens:**
- Uploads program to devnet
- Costs ~2-3 SOL (test SOL, FREE)
- Takes 1-2 minutes
- Shows "Program Id: EZDyb..." when successful

### Method 2: Using Anchor (May have issues)

```bash
anchor deploy
```

If this fails with "missing field address", use Method 1 instead.

---

## Part 8: Verify Deployment

```bash
# Check program exists
solana program show EZDyb8s4DgMksN6aPx7gbeZ8B7SjWms3YuXu3VgUT11T

# Check your balance
solana balance
```

**View on Explorer:**
https://explorer.solana.com/address/EZDyb8s4DgMksN6aPx7gbeZ8B7SjWms3YuXu3VgUT11T?cluster=devnet

---

## Part 9: Configure Frontend

Your `frontend/.env` should have:

```bash
VITE_PROGRAM_ID=EZDyb8s4DgMksN6aPx7gbeZ8B7SjWms3YuXu3VgUT11T
VITE_SOLANA_NETWORK=devnet
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_SOLANA_WEBSOCKET_URL=wss://api.devnet.solana.com
```

---

## Part 10: Test Frontend Locally

```bash
cd frontend

# Install dependencies (if not done)
npm install

# Start dev server
npm run dev
```

Open http://localhost:5173

**Test:**
1. Make sure Phantom is on Devnet
2. Click "Connect Wallet"
3. Select Phantom
4. Approve connection
5. Check balance shows

---

## Part 11: Troubleshooting

### "Error: missing field address"
**Fix:** Update Anchor.toml with proper format (see Part 5)

### "anchor deploy" fails
**Fix:** Use `solana program deploy` instead (Method 1 in Part 7)

### "Insufficient funds"
**Fix:** Get more test SOL: `solana airdrop 2`

### "Program already deployed"
**Fix:** Use upgrade instead:
```bash
solana program upgrade target/deploy/dex.so \
  --program-id EZDyb8s4DgMksN6aPx7gbeZ8B7SjWms3YuXu3VgUT11T
```

### Frontend can't connect
**Fix:**
- Check Phantom is on Devnet
- Verify VITE_PROGRAM_ID in .env matches deployed program
- Clear browser cache

### Transaction timeout
**Fix:** Wait 30 seconds and try again (network congestion)

---

## Part 12: Deploy to Mainnet (After Testing)

### ⚠️ ONLY AFTER THOROUGH TESTING ON DEVNET ⚠️

### 1. Get Real SOL
- Buy 5-10 SOL from exchange
- Transfer to NEW mainnet wallet (never reuse devnet wallet!)

### 2. Update Configuration

**anchor/.env:**
```bash
SOLANA_NETWORK=mainnet-beta
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

**frontend/.env:**
```bash
VITE_SOLANA_NETWORK=mainnet-beta
VITE_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
VITE_SOLANA_WEBSOCKET_URL=wss://api.mainnet-beta.solana.com
VITE_SHOW_TESTNET_WARNING=false
```

### 3. Configure CLI

```bash
solana config set --url mainnet-beta
solana balance
```

### 4. Deploy

```bash
cd anchor
anchor build
solana program deploy target/deploy/dex.so \
  --program-id target/deploy/dex-keypair.json \
  --max-len 350000
```

**Cost:** ~2-5 SOL (~$400-1000 USD)

### 5. Update Frontend

Update VITE_PROGRAM_ID with new mainnet program ID.

---

## Part 13: Deploy Frontend to HostGator

### 1. Build Production Frontend

```bash
cd frontend
npm run build
```

This creates `dist/` folder.

### 2. Upload to HostGator

**Using FTP:**
- Host: ftp.yourdomain.com
- Username: from HostGator
- Password: from HostGator
- Upload all files from `dist/` to `public_html/`

**Using FileZilla:**
1. Connect to HostGator FTP
2. Navigate to `public_html/`
3. Upload everything from `dist/`
4. Wait for upload to complete

### 3. Configure Domain

- Point domain DNS to HostGator
- Enable SSL (free in HostGator)
- Wait for DNS propagation (24-48 hours)

### 4. Test

- Visit https://dexspeed.com.br
- Connect wallet
- Test all features

---

## Quick Reference

### Devnet Deployment
```bash
# 1. Setup
solana config set --url devnet
solana airdrop 2

# 2. Build
cd anchor
anchor build

# 3. Deploy
solana program deploy target/deploy/dex.so \
  --program-id target/deploy/dex-keypair.json \
  --max-len 350000

# 4. Verify
solana program show EZDyb8s4DgMksN6aPx7gbeZ8B7SjWms3YuXu3VgUT11T

# 5. Test frontend
cd ../frontend
npm run dev
```

### Mainnet Deployment
```bash
# 1. Setup
solana config set --url mainnet-beta

# 2. Build
cd anchor
anchor build

# 3. Deploy
solana program deploy target/deploy/dex.so \
  --program-id target/deploy/dex-keypair.json \
  --max-len 350000

# 4. Build frontend
cd ../frontend
npm run build

# 5. Upload dist/ to HostGator
```

---

## Cost Summary

**Devnet (Testing):**
- Deployment: 2-3 SOL (FREE - test tokens)
- Total: $0 USD

**Mainnet (Production):**
- Deployment: 2-5 SOL ≈ $400-1000 USD
- Domain: R$40-80/year
- Hosting: R$50/month
- Total first year: ~$500-1200 USD

---

## Success Checklist

- [ ] Phantom wallet on devnet
- [ ] Got test SOL (airdrop)
- [ ] Exported private key
- [ ] Created keypair file
- [ ] Configured Solana CLI
- [ ] Updated Anchor.toml
- [ ] Built program (`anchor build`)
- [ ] Deployed to devnet
- [ ] Verified on explorer
- [ ] Updated frontend .env
- [ ] Tested frontend locally
- [ ] All features working
- [ ] Ready for client demo

---

## Support

**If deployment fails:**
1. Check error message
2. Look in troubleshooting section
3. Verify all prerequisites
4. Check Solana Explorer for details

**Devnet Explorer:**
https://explorer.solana.com/?cluster=devnet

**Current Deployment:**
- Program ID: `EZDyb8s4DgMksN6aPx7gbeZ8B7SjWms3YuXu3VgUT11T`
- Network: Devnet
- Status: Deployed ✅
