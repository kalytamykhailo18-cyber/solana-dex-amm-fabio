// Quick script to check LP token balance
const { Connection, PublicKey } = require('@solana/web3.js');
const { getAssociatedTokenAddress, getAccount } = require('@solana/spl-token');

async function checkLpBalance() {
  const connection = new Connection('http://127.0.0.1:8899', 'confirmed');

  // Replace with your wallet and LP mint addresses
  const walletPubkey = new PublicKey('YOUR_WALLET_ADDRESS_HERE');
  const lpMint = new PublicKey('G6A1QpduKLTzNeG9iBazZkonzurWELPxhLEEDt7B3DH4'); // From account.txt

  try {
    const lpTokenAccount = await getAssociatedTokenAddress(lpMint, walletPubkey);
    console.log('LP Token Account:', lpTokenAccount.toString());

    const accountInfo = await getAccount(connection, lpTokenAccount);
    console.log('LP Token Balance:', accountInfo.amount.toString());
    console.log('LP Mint:', accountInfo.mint.toString());
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkLpBalance();
