# DexSpeed Quick Start Guide

**Complete this in 30 minutes!**

---

## Step 1: Prerequisites (5 min)

Install required tools:

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.30.1
avm use 0.30.1

# Verify
solana --version
anchor --version
```

---

## Step 2: Deploy Smart Contract to Devnet (10 min)

```bash
cd anchor

# Configure for devnet
solana config set --url https://api.devnet.solana.com

# Create/import wallet
solana-keygen new --outfile ~/.config/solana/id.json
# OR to import existing: solana-keygen recover --outfile ~/.config/solana/id.json

# Get test SOL
solana airdrop 2
solana balance

# Build program
anchor build

# Deploy to devnet
anchor deploy

# SAVE THE PROGRAM ID!!!
# Example output: "Program Id: ABC123...XYZ"
```

---

## Step 3: Configure Frontend (3 min)

```bash
cd ../frontend

# Create .env file
cp .env.example .env

# Edit .env and set these values:
# VITE_PROGRAM_ID=<YOUR_PROGRAM_ID_FROM_STEP_2>
# VITE_SOLANA_NETWORK=devnet
# VITE_SOLANA_RPC_URL=https://api.devnet.solana.com

# Install dependencies
npm install
```

---

## Step 4: Copy IDL Files (2 min)

```bash
# From project root
cp anchor/target/idl/dex.json frontend/src/idl/
cp anchor/target/types/dex.ts frontend/src/idl/
```

---

## Step 5: Build Frontend (5 min)

```bash
cd frontend

# Build for production
npm run build

# Test locally (optional)
npm run preview
# Visit http://localhost:4173
```

---

## Step 6: Deploy to HostGator (5 min)

### Option A: cPanel File Manager

1. Login to HostGator cPanel
2. Open **File Manager**
3. Navigate to `public_html/`
4. Delete all existing files
5. Upload ALL files from `frontend/dist/`:
   - `index.html`
   - `favicon.svg`
   - `assets/` folder (all files inside)
6. Done! Visit your domain

### Option B: FTP

```bash
# Using any FTP client (FileZilla, etc.)
# Host: ftp.yourdomain.com.br
# Username: your_cpanel_username
# Password: your_cpanel_password
# Upload frontend/dist/* to public_html/
```

---

## Step 7: Configure SSL (3 min)

1. In cPanel, go to **SSL/TLS Status**
2. Enable **AutoSSL** for your domain
3. Wait 5-10 minutes
4. Visit https://yourdomain.com.br

---

## Step 8: Test Your DEX! (5 min)

1. Visit your domain
2. Click "Connect Wallet"
3. Select Phantom or Solflare
4. Switch wallet to **Devnet**
5. Go to "Create Pool"
6. Create your first pool!

---

## Common Issues

### "Wallet won't connect"
- Make sure wallet is on Devnet network
- Check browser console for errors

### "Transaction failed"
- Run: `solana airdrop 1` to get more SOL
- Wait a few seconds and try again

### "Program not found"
- Double-check VITE_PROGRAM_ID in frontend/.env
- Verify program deployed: `solana program show <PROGRAM_ID>`

---

## Next Steps

### Ready for Mainnet?

```bash
# 1. Switch to mainnet
solana config set --url https://api.mainnet-beta.solana.com

# 2. Ensure wallet has real SOL (5-10 SOL recommended)
solana balance

# 3. Deploy to mainnet
cd anchor
anchor deploy

# 4. Update frontend .env with new Program ID
cd ../frontend
# Edit .env:
# VITE_PROGRAM_ID=<NEW_MAINNET_PROGRAM_ID>
# VITE_SOLANA_NETWORK=mainnet-beta
# VITE_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# 5. Rebuild and redeploy
npm run build
# Upload dist/ to HostGator
```

---

## Costs Summary

### Development (One-time)
- ✅ $180 freelancer fee

### Deployment (One-time)
- Devnet: **FREE**
- Mainnet: ~0.5-1 SOL ($50-100)

### Ongoing
- HostGator: R$50/month
- Domain: R$40-80/year
- Transaction fees: ~$0.00025/tx (negligible)

---

## Support

- Full deployment guide: See `/DEPLOYMENT.md`
- Project status: See `/PROJECT_STATUS.md`
- Troubleshooting: See `/DEPLOYMENT.md` (section 7)

---

**Need help?** All documentation is in the project root folder.

**Ready to go!** Your DexSpeed DEX is live! 🚀
