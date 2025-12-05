import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Transaction } from '../types';

interface TransactionsState {
  items: Transaction[];
}

const initialState: TransactionsState = {
  items: [],
};

export const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      state.items.unshift(action.payload);
      // Keep only last 50 transactions
      if (state.items.length > 50) {
        state.items = state.items.slice(0, 50);
      }
    },
    updateTransaction: (state, action: PayloadAction<Transaction>) => {
      const index = state.items.findIndex(
        (t: Transaction) => t.signature === action.payload.signature
      );
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    clearTransactions: (state) => {
      state.items = [];
    },
  },
});

export const {
  addTransaction,
  updateTransaction,
  clearTransactions,
} = transactionsSlice.actions;

export default transactionsSlice.reducer;
