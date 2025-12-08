# What To Do Next - DexSpeed DEX Deployment Guide

## Current Status ✅

**Completed:**
- ✅ Smart contract built successfully
- ✅ Frontend configured
- ✅ Phantom wallet set up with 5 SOL (devnet)
- ✅ Wallet keypair created: `~/.config/solana/id.json`
- ✅ All .env files configured
- ✅ Program ID: `EZDyb8s4DgMksN6aPx7gbeZ8B7SjWms3YuXu3VgUT11T`

**Your Wallet:**
- Address: `Fu8Zz6oShdTMHnmxFeP7bWQmekvKZSYaUn4HbyGm1JD2`
- Balance: 5 SOL (devnet test tokens)
- Network: Devnet

---

## Step 1: Deploy Smart Contract to Devnet (FREE)

### Open Terminal

```bash
cd /home/a/Documents/projects/solana-dex-amm-fabio/anchor
```

### Deploy the Program

```bash
anchor deploy
```

**What happens:**
- Uploads your smart contract to Solana devnet
- Costs ~2 SOL (test SOL, FREE)
- Takes 1-2 minutes
- You'll see: "Program deployed successfully"

**Expected Output:**
```
Deploying cluster: https://api.devnet.solana.com
Program Id: EZDyb8s4DgMksN6aPx7gbeZ8B7SjWms3YuXu3VgUT11T
Deploy success
```

### If Deployment Fails

**Problem: "Insufficient funds"**
```bash
solana airdrop 2
```

**Problem: "Program already deployed"**
```bash
anchor upgrade target/deploy/dex.so --program-id EZDyb8s4DgMksN6aPx7gbeZ8B7SjWms3YuXu3VgUT11T
```

**Problem: Network timeout**
- Wait 1 minute and try again
- Or use: `anchor deploy --provider.cluster devnet`

---

## Step 2: Test Frontend Locally (FREE)

### Open New Terminal

```bash
cd /home/a/Documents/projects/solana-dex-amm-fabio/frontend
```

### Install Dependencies (if not done)

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

**What happens:**
- Frontend starts on `http://localhost:5173`
- Opens in your browser automatically
- You can now test the DEX

### Test in Browser

1. **Connect Wallet:**
   - Make sure Phantom is on **Devnet**
   - Click "Connect Wallet"
   - Select Phantom
   - Approve connection

2. **Check Your Balance:**
   - Should show ~3 SOL (5 SOL - deployment cost)

3. **Create a Test Pool (Optional):**
   - Click "Create Pool"
   - You need 2 different tokens to test
   - For now, just verify the UI works

### If Frontend Has Errors

**Problem: "Cannot find module"**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Problem: "Cannot connect to program"**
- Check Phantom is on Devnet
- Check Program ID in `.env` is correct
- Verify program was deployed successfully

---

## Step 3: Get Test Tokens (For Testing Swaps)

To fully test the DEX, you need test tokens.

### Option A: Use Existing Tokens on Devnet

Some devnet tokens you can use:
- Wrapped SOL: `So11111111111111111111111111111111111111112`
- Devnet USDC: `Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr`

### Option B: Create Your Own Test Token

```bash
# Create a new token mint
spl-token create-token

# You'll get an address like: 7xKXt...
# This is your test token mint address

# Create a token account
spl-token create-account <TOKEN_MINT_ADDRESS>

# Mint some tokens to yourself
spl-token mint <TOKEN_MINT_ADDRESS> 1000
```

### Option C: Skip for Now

You can test the UI and wallet connection without creating pools yet.

---

## Step 4: Create First Pool (Optional for Testing)

### In the Frontend:

1. Click "Create Pool"
2. Select Token A (e.g., EBK or test token)
3. Select Token B (e.g., Wrapped SOL)
4. Set initial amounts (e.g., 10 tokens each)
5. Set fee (default: 0.3%)
6. Click "Create Pool"
7. Approve in Phantom

**Cost:** ~0.01 SOL (test SOL, FREE)

### Verify Pool Created

- You should see the pool in "Your Pools"
- Balance of tokens should decrease
- You should receive LP tokens

---

## Step 5: Test Swap (Optional)

### In the Frontend:

1. Go to "Swap" page
2. Select tokens from the pool you created
3. Enter amount to swap
4. Click "Swap"
5. Approve in Phantom

**Cost:** ~0.0001 SOL + swap fee

### Verify Swap Worked

- Token balances should change
- Transaction should show in Phantom

---

## Step 6: Review & Testing Checklist

Test all features to make sure everything works:

- [ ] Wallet connects successfully
- [ ] Balance shows correctly
- [ ] Can navigate between pages
- [ ] Create pool works (if you have test tokens)
- [ ] Add liquidity works
- [ ] Remove liquidity works
- [ ] Swap works
- [ ] UI looks good (colors, layout)
- [ ] No console errors

### Check Developer Console

Press `F12` in browser:
- Look for errors (red text)
- Check Network tab for failed requests
- Verify program calls are working

---

## Step 7: Show Client for Approval

Once everything works on devnet, show the client:

1. **Take Screenshots:**
   - Home page
   - Wallet connected
   - Pool creation
   - Swap interface
   - Transaction success

2. **Record Short Video:**
   - Connect wallet
   - Create pool
   - Make a swap
   - Show it working

3. **Share Links:**
   - Send localhost screenshots
   - Or deploy to test domain

4. **Get Approval:**
   - Client confirms it works
   - Client approves moving to mainnet

---

## Step 8: Deploy to Mainnet (COSTS REAL MONEY)

**⚠️ ONLY DO THIS AFTER CLIENT APPROVAL ⚠️**

### Cost Estimate:
- Deploy smart contract: 2-5 SOL ≈ $400-1000 USD
- Create initial pool: 0.01 SOL ≈ $2 USD
- Total: ~$400-1000 USD in SOL

### Before Mainnet Deployment:

1. **Test thoroughly on devnet** ✅
2. **Get client approval** ⏳
3. **Purchase domain** (dexspeed.com.br or speeddex.com.br)
4. **Purchase hosting** (HostGator R$50/month)
5. **Get real SOL** (5-10 SOL recommended)

### Mainnet Deployment Steps:

```bash
# 1. Update anchor/.env
SOLANA_NETWORK=mainnet-beta
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# 2. Update frontend/.env
VITE_SOLANA_NETWORK=mainnet-beta
VITE_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
VITE_SHOW_TESTNET_WARNING=false

# 3. Configure Solana CLI
solana config set --url mainnet-beta

# 4. Create new mainnet wallet (IMPORTANT!)
solana-keygen new --outfile ~/.config/solana/mainnet.json

# 5. Fund with real SOL
# Send 5-10 SOL from exchange to new address

# 6. Deploy
cd anchor
anchor build
anchor deploy --provider.cluster mainnet

# 7. Update Program ID in frontend/.env
# Copy new mainnet program ID

# 8. Build frontend
cd ../frontend
npm run build

# 9. Upload dist/ folder to HostGator
```

---

## Step 9: Deploy Frontend to HostGator

### Build Production Frontend:

```bash
cd /home/a/Documents/projects/solana-dex-amm-fabio/frontend
npm run build
```

**Output:** `dist/` folder with all files

### Upload to HostGator:

1. **Connect via FTP:**
   - Use FileZilla or similar
   - Host: ftp.yourdomain.com
   - Username: from HostGator
   - Password: from HostGator

2. **Upload Files:**
   - Go to `public_html/` directory
   - Upload everything from `dist/` folder
   - Wait for upload to complete

3. **Configure Domain:**
   - Point domain DNS to HostGator
   - Enable SSL (free with HostGator)
   - Wait for DNS propagation (24-48 hours)

4. **Test Production:**
   - Visit https://dexspeed.com.br
   - Connect wallet (mainnet!)
   - Test all features
   - Monitor for errors

---

## Quick Commands Reference

### Check Status

```bash
# Check balance
solana balance

# Check network
solana config get

# Check wallet address
solana address

# Get more test SOL
solana airdrop 2
```

### Development

```bash
# Start frontend
cd frontend && npm run dev

# Rebuild smart contract
cd anchor && anchor build

# Run tests
cd anchor && anchor test
```

### Deployment

```bash
# Deploy to devnet
cd anchor && anchor deploy

# Deploy to mainnet
cd anchor && anchor deploy --provider.cluster mainnet

# Build frontend
cd frontend && npm run build
```

---

## Common Issues & Solutions

### Issue: Phantom not connecting
**Solution:** Make sure Phantom is on correct network (devnet/mainnet)

### Issue: Transaction fails
**Solution:** Check you have enough SOL for fees

### Issue: Pool creation fails
**Solution:** Make sure you have token accounts and balances

### Issue: "Program not found"
**Solution:** Program not deployed yet, run `anchor deploy`

### Issue: Frontend shows wrong balance
**Solution:** Refresh page, check network matches deployed program

---

## Important Reminders

**On Devnet (Current):**
- ✅ Everything is FREE
- ✅ Test as much as you want
- ✅ SOL has no value
- ✅ Can airdrop unlimited test SOL

**On Mainnet (Future):**
- ⚠️ Costs REAL money
- ⚠️ Every transaction costs SOL
- ⚠️ Be careful with private keys
- ⚠️ Test thoroughly on devnet first!

**Security:**
- ❌ NEVER share mainnet private keys
- ❌ NEVER commit .env files to git
- ❌ NEVER share keypair files
- ✅ Use separate wallets for dev/prod
- ✅ Keep backups of important keys

---

## Support & Documentation

**Documentation Created:**
- `PHANTOM_WALLET_SETUP.md` - Wallet setup guide
- `WALLET_SUMMARY.md` - Quick wallet reference
- `NEXT_STEPS.md` - Original development steps
- `WHAT_TO_DO_NEXT.md` - This file

**If You Need Help:**
1. Check error messages in terminal
2. Check browser console (F12)
3. Check Phantom transaction history
4. Verify network settings (devnet vs mainnet)
5. Check Solana Explorer: https://explorer.solana.com/?cluster=devnet

---

## Timeline Estimate

**Today (Devnet Testing):**
- Deploy to devnet: 5 minutes
- Test frontend: 15 minutes
- Create test pool: 10 minutes
- Full testing: 30 minutes
- **Total: ~1 hour**

**After Client Approval (Mainnet):**
- Purchase domain: 1 day
- Purchase hosting: 1 day
- Get SOL: 1-2 days
- Deploy mainnet: 30 minutes
- Deploy frontend: 30 minutes
- DNS propagation: 1-2 days
- **Total: ~5-7 days**

---

## Your Next Action

**RIGHT NOW:**

```bash
cd /home/a/Documents/projects/solana-dex-amm-fabio/anchor
anchor deploy
```

Then wait for "Deploy success" message.

That's it! Everything else is already set up and ready to go! 🚀
