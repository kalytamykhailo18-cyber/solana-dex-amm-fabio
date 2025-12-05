import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PublicKey } from '@solana/web3.js';
import { UserBalance } from '../types';

interface WalletState {
  publicKey: PublicKey | null;
  connected: boolean;
  balances: UserBalance[];
  solBalance: number;
}

const initialState: WalletState = {
  publicKey: null,
  connected: false,
  balances: [],
  solBalance: 0,
};

export const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setWallet: (state, action: PayloadAction<PublicKey | null>) => {
      state.publicKey = action.payload;
      state.connected = action.payload !== null;
    },
    disconnectWallet: (state) => {
      state.publicKey = null;
      state.connected = false;
      state.balances = [];
      state.solBalance = 0;
    },
    updateBalance: (state, action: PayloadAction<UserBalance>) => {
      const index = state.balances.findIndex(
        (b: UserBalance) => b.mint.toBase58() === action.payload.mint.toBase58()
      );
      if (index !== -1) {
        state.balances[index] = action.payload;
      } else {
        state.balances.push(action.payload);
      }
    },
    setSolBalance: (state, action: PayloadAction<number>) => {
      state.solBalance = action.payload;
    },
    clearBalances: (state) => {
      state.balances = [];
    },
  },
});

export const {
  setWallet,
  disconnectWallet,
  updateBalance,
  setSolBalance,
  clearBalances,
} = walletSlice.actions;

export default walletSlice.reducer;
