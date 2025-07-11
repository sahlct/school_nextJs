"use client"

import type React from "react"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Provider } from "react-redux"
import { store } from "@/lib/store"
import { useState, useEffect } from "react"
import { useAppDispatch } from "@/lib/hooks"
import { initializeAuth } from "@/lib/store"
import { authAPI, tokenManager } from "@/lib/api"

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()

  useEffect(() => {
    // Check if user is authenticated on app start
    const token = tokenManager.getToken()
    if (token) {
      // In a real app, you might want to validate the token with the server
      // For now, we'll assume the token is valid if it exists
      // You could decode the JWT to get user info or make an API call to verify
      try {
        // Mock user data - in real app, decode token or fetch user data
        const mockUser = {
          id: 8,
          name: "Default Admin",
          email: "mhdsahlct@gmail.com",
          contact_number: "9999999999",
          isAdmin: true,
          role: "teacher",
        }
        dispatch(initializeAuth(mockUser))
      } catch (error) {
        // Token is invalid, remove it
        authAPI.logout()
        dispatch(initializeAuth(null))
      }
    } else {
      dispatch(initializeAuth(null))
    }
  }, [dispatch])

  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthInitializer>{children}</AuthInitializer>
      </QueryClientProvider>
    </Provider>
  )
}
