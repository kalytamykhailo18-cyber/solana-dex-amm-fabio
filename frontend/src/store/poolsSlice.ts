import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Pool, LoadingState } from '../types';

interface PoolsState {
  items: Pool[];
  selectedPool: Pool | null;
  loading: LoadingState;
  error: string | null;
}

const initialState: PoolsState = {
  items: [],
  selectedPool: null,
  loading: 'idle',
  error: null,
};

export const poolsSlice = createSlice({
  name: 'pools',
  initialState,
  reducers: {
    addPool: (state, action: PayloadAction<Pool>) => {
      const exists = state.items.some(
        (p: Pool) => p.address.toBase58() === action.payload.address.toBase58()
      );
      if (!exists) {
        state.items.push(action.payload);
      }
    },
    updatePool: (state, action: PayloadAction<Pool>) => {
      const index = state.items.findIndex(
        (p: Pool) => p.address.toBase58() === action.payload.address.toBase58()
      );
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    selectPool: (state, action: PayloadAction<Pool | null>) => {
      state.selectedPool = action.payload;
    },
    setLoading: (state, action: PayloadAction<LoadingState>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearPools: (state) => {
      state.items = [];
      state.selectedPool = null;
    },
  },
});

export const {
  addPool,
  updatePool,
  selectPool,
  setLoading,
  setError,
  clearPools,
} = poolsSlice.actions;

export default poolsSlice.reducer;
