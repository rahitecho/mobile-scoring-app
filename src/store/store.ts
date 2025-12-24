import { configureStore } from '@reduxjs/toolkit'
import { api } from './api'
import { otpApi } from './otpApi'
import authSlice from './slices/authSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice,
    [api.reducerPath]: api.reducer,
    [otpApi.reducerPath]: otpApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware, otpApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch