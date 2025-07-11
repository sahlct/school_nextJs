"use client"

import type React from "react"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { useAppDispatch } from "@/lib/hooks"
import { loginSuccess, setLoading } from "@/lib/store"
import { authAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, Lock, Shield } from "lucide-react"
import { OTPInput } from "@/components/ui/otp-input"

export default function LoginPage() {
  const dispatch = useAppDispatch()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [error, setError] = useState("")

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => authAPI.login(email, password),
    onMutate: () => {
      dispatch(setLoading(true))
      setError("")
    },
    onSuccess: (user) => {
      dispatch(loginSuccess(user))
    },
    onError: (error: Error) => {
      setError(error.message)
      dispatch(setLoading(false))
    },
  })

  const sendOTPMutation = useMutation({
    mutationFn: (email: string) => authAPI.sendOTP(email),
    onSuccess: () => {
      setOtpSent(true)
      setError("")
    },
    onError: (error: Error) => {
      setError(error.message)
    },
  })

  const verifyOTPMutation = useMutation({
    mutationFn: ({ email, otp }: { email: string; otp: string }) => authAPI.verifyOTP(email, otp),
    onMutate: () => {
      dispatch(setLoading(true))
      setError("")
    },
    onSuccess: (user) => {
      dispatch(loginSuccess(user))
    },
    onError: (error: Error) => {
      setError(error.message)
      dispatch(setLoading(false))
    },
  })

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError("Please fill in all fields")
      return
    }
    loginMutation.mutate({ email, password })
  }

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError("Please enter your email")
      return
    }
    sendOTPMutation.mutate(email)
  }

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp || otp.length !== 6) {
      setError("Please enter the complete 6-digit OTP")
      return
    }
    verifyOTPMutation.mutate({ email, otp })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Admin Dashboard</CardTitle>
          <CardDescription>Sign in to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Email & Password
              </TabsTrigger>
              <TabsTrigger value="otp" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                OTP Login
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="space-y-4">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="mhdsahlct@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loginMutation.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loginMutation.isPending}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="otp" className="space-y-4">
              {!otpSent ? (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp-email">Email</Label>
                    <Input
                      id="otp-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={sendOTPMutation.isPending}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={sendOTPMutation.isPending}>
                    {sendOTPMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Send OTP
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp">Enter 6-digit OTP</Label>
                    <OTPInput value={otp} onChange={setOtp} disabled={verifyOTPMutation.isPending} />
                    <p className="text-sm text-muted-foreground text-center">OTP sent to {email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setOtpSent(false)
                        setOtp("")
                      }}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button type="submit" className="flex-1" disabled={verifyOTPMutation.isPending}>
                      {verifyOTPMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        "Verify OTP"
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </TabsContent>
          </Tabs>

          {error && (
            <Alert className="mt-4" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}


        </CardContent>
      </Card>
    </div>
  )
}
