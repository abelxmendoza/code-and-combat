import { configureStore } from '@reduxjs/toolkit';
import bookingReducer from './bookingSlice';
import adminReducer from './adminSlice';

export const store = configureStore({
  reducer: {
    booking: bookingReducer,
    admin: adminReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
