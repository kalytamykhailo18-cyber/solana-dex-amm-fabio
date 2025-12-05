import { configureStore } from '@reduxjs/toolkit';
import poolsReducer from './poolsSlice';
import walletReducer from './walletSlice';
import transactionsReducer from './transactionsSlice';

export const store = configureStore({
  reducer: {
    pools: poolsReducer,
    wallet: walletReducer,
    transactions: transactionsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['wallet/setWallet', 'pools/addPool', 'pools/updatePool'],
        // Ignore these paths in the state
        ignoredPaths: ['wallet.publicKey', 'pools.items'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
