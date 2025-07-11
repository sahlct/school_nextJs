import { configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { authAPI } from "./api"

interface User {
  id: number
  name: string
  email: string
  contact_number: string
  isAdmin: boolean
  role: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.user = action.payload
      state.isAuthenticated = true
      state.loading = false
    },
    logout: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.loading = false
      authAPI.logout() // Clear token from localStorage
    },
    initializeAuth: (state, action: PayloadAction<User | null>) => {
      if (action.payload) {
        state.user = action.payload
        state.isAuthenticated = true
      } else {
        state.user = null
        state.isAuthenticated = false
      }
      state.loading = false
    },
  },
})

export const { setLoading, loginSuccess, logout, initializeAuth } = authSlice.actions

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
