# Phantom Wallet Setup for DexSpeed DEX

## What is Phantom Wallet?

Phantom is the most popular Solana wallet browser extension. You need it to:
- Deploy the smart contract (pay deployment fees)
- Test the DEX frontend (connect wallet, swap tokens)
- Manage your SOL and SPL tokens

---

## Step 1: Install Phantom Wallet

### Browser Extension (Recommended)
1. Go to https://phantom.app/download
2. Click "Add to Chrome" (or your browser)
3. Install the extension
4. Create a new wallet OR import existing wallet

### Mobile App (Optional)
- Available on iOS App Store and Google Play Store

---

## Step 2: Enable Devnet (Test Network)

**IMPORTANT: You must enable devnet to test without spending real money**

1. Open Phantom wallet extension
2. Click the **hamburger menu (☰)** at top-left
3. Click **Settings** (gear icon ⚙️)
4. Scroll down to find **"Developer Settings"**
5. Toggle **"Testnet Mode"** to ON (enable it)
6. Go back to main screen
7. At the **top of wallet**, click the network dropdown
8. Currently shows: **"Mainnet Beta"**
9. Select **"Devnet"** from the list

**Visual:**
```
┌─────────────────────────┐
│  ☰  [Mainnet Beta ▼] ⚙️ │ ← Click here
├─────────────────────────┤
│  Select Network:        │
│  ○ Mainnet Beta         │
│  ● Devnet          ←──  │ Click this!
│  ○ Testnet              │
└─────────────────────────┘
```

---

## Step 3: Get Your Wallet Address

1. Make sure you're on **Devnet**
2. Your wallet address is shown at the top
3. Click on it to **copy**
4. Example: `Fu8Zz6oShdTMHnmxFeP7bWQmekvKZSYaUn4HbyGm1JD2`

**Note:** Your address is the same on all networks (devnet, testnet, mainnet)

---

## Step 4: Get Free Test SOL (Devnet Only)

### Method 1: Phantom Built-in Faucet
1. While on Devnet in Phantom
2. Click "Receive" or the faucet icon
3. Click "Airdrop" or "Get Devnet SOL"
4. Wait a few seconds
5. You should receive test SOL

### Method 2: Solana CLI (What We Used)
```bash
# Configure CLI for devnet
solana config set --url devnet

# Request airdrop (max 5 SOL per request)
solana airdrop 2
```

### Method 3: Web Faucet
Go to: https://faucet.solana.com/
- Paste your wallet address
- Complete captcha
- Click "Airdrop"

**Current Status:**
- Your address: `Fu8Zz6oShdTMHnmxFeP7bWQmekvKZSYaUn4HbyGm1JD2`
- Current balance: **5 SOL** (devnet)

---

## Step 5: Export Private Key (For Deployment)

**IMPORTANT: Only do this for DEVNET wallet!**

To deploy with Anchor, we need your private key in a keypair file.

1. Open Phantom wallet
2. Click **Settings** (⚙️)
3. Click **"Export Private Key"**
4. Enter your Phantom password
5. Copy the private key
6. It looks like: `4UNqvpAFfUUjo7h2madWKH9XhfHFkeqcncKDdCtA21vkYjuvTkLrCaHqT6zcGnBw4ReuDNL14FyLR8UtbYm2dSHi`

**What We Did:**
- Converted your private key to keypair file format
- Saved it to: `~/.config/solana/id.json`
- This allows Anchor to deploy using your wallet

**Security Notes:**
- ✅ Safe for devnet (test SOL has no value)
- ❌ NEVER share mainnet private key!
- ❌ NEVER commit keypair files to git!

---

## Step 6: Configure Project .env Files

### Anchor .env (Smart Contract)
Location: `anchor/.env`

```bash
DEPLOYER_KEYPAIR_PATH=~/.config/solana/id.json
WALLET_ADDRESS=Fu8Zz6oShdTMHnmxFeP7bWQmekvKZSYaUn4HbyGm1JD2
```

### Frontend .env (Already configured)
Location: `frontend/.env`

No wallet address needed here - users connect their own wallets through the UI.

---

## Step 7: Verify Setup

Run these commands to verify everything is configured:

```bash
# Check Solana CLI is using devnet
solana config get

# Should show:
# RPC URL: https://api.devnet.solana.com
# Keypair Path: /home/a/.config/solana/id.json

# Check your wallet address
solana address

# Should show: Fu8Zz6oShdTMHnmxFeP7bWQmekvKZSYaUn4HbyGm1JD2

# Check your balance
solana balance

# Should show: 5 SOL
```

---

## Step 8: Test in Frontend (After Deployment)

1. Make sure Phantom is on **Devnet**
2. Open the frontend: `npm run dev`
3. Click **"Connect Wallet"**
4. Select **Phantom**
5. Approve connection
6. You should see your balance: 5 SOL

---

## Important Notes

### Devnet vs Mainnet

| Network | Purpose | SOL Value | Use For |
|---------|---------|-----------|---------|
| **Devnet** | Testing | FREE (no value) | Development, testing |
| **Testnet** | Testing | FREE (no value) | Alternative testing |
| **Mainnet** | Production | REAL ($$$) | Live trading |

### Always Check Your Network!

Look at the top of Phantom:
- ✅ **"Devnet"** = Safe to test
- ⚠️ **"Mainnet Beta"** = Real money!

### Switching Networks

When you switch networks in Phantom:
- Your address stays the same
- Your balance changes (different balances on different networks)
- Tokens are different (devnet tokens ≠ mainnet tokens)

---

## Deployment Costs

### Devnet (Current - FREE)
- Deploy program: ~2 SOL (test SOL, free)
- Create pool: ~0.01 SOL (test SOL, free)
- Total cost: **$0 USD**

### Mainnet (Production - REAL COST)
- Deploy program: ~2-5 SOL ≈ **$400-1000 USD**
- Create pool: ~0.01 SOL ≈ **$2 USD**
- Rent (storage): ~0.002 SOL ≈ **$0.40 USD**
- Total: **~$400-1000 USD**

**Recommendation:** Test everything on devnet first! Only deploy to mainnet when 100% ready.

---

## Troubleshooting

### Problem: Can't see devnet option
**Solution:** Update Phantom to latest version

### Problem: Airdrop fails
**Solution:**
- Try web faucet: https://faucet.solana.com/
- Wait a few minutes and try again
- Maximum 5 SOL per request

### Problem: Wrong network
**Solution:** Click network dropdown at top and select "Devnet"

### Problem: Private key export not working
**Solution:**
- Make sure you're logged into Phantom
- Try restarting browser
- Check if you have the latest Phantom version

### Problem: Balance not showing
**Solution:**
- Make sure you're on Devnet
- Click refresh in Phantom
- Wait a few seconds for blockchain sync

---

## Current Project Status

✅ **Completed:**
- Phantom wallet installed
- Devnet enabled
- 5 SOL (test) in wallet
- Private key exported
- Keypair file created: `~/.config/solana/id.json`
- Solana CLI configured for devnet
- Anchor .env configured
- Frontend .env configured

🔄 **Ready for:**
- Deploy smart contract to devnet
- Test DEX locally
- Create test pools
- Test swaps

⏭️ **Future (After Testing):**
- Deploy to mainnet (costs real SOL)
- Purchase domain and hosting
- Deploy frontend to HostGator

---

## Quick Reference

**Your Devnet Wallet:**
```
Address: Fu8Zz6oShdTMHnmxFeP7bWQmekvKZSYaUn4HbyGm1JD2
Balance: 5 SOL (test)
Network: Devnet
Keypair: ~/.config/solana/id.json
```

**Useful Commands:**
```bash
# Check balance
solana balance

# Get more test SOL
solana airdrop 2

# Check network
solana config get

# Switch to devnet
solana config set --url devnet

# Check wallet address
solana address
```

**Next Step:** Deploy smart contract to devnet!
