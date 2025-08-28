"use client"

import { useState, useEffect } from "react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

interface User {
  id: string
  name: string
  email: string
  profileType?: 'broker' | 'principal' | 'seller' | 'introducer' | 'buyer'
}

interface SignInProps {
  onSignIn: (user: User, token: string) => void
}

export default function SignIn({ onSignIn }: SignInProps) {
  const [mode, setMode] = useState<"main" | "login" | "register" | "google" | "profile">("main")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [inviteToken, setInviteToken] = useState("")
  const [inviteLink, setInviteLink] = useState("")
  const [profileType, setProfileType] = useState<'broker' | 'principal' | 'seller' | 'introducer' | 'buyer'>('broker')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [newUser, setNewUser] = useState<User | null>(null)

  // Check for invite token in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get("invite")
    if (token) {
      setInviteToken(token)
      setMode("register")
    }
  }, [])

  function handleInviteLinkPaste() {
    if (!inviteLink.trim()) return
    try {
      const url = new URL(inviteLink)
      const token = url.searchParams.get("invite")
      if (token) {
        setInviteToken(token)
        setMode("register")
      } else {
        setError("Invalid invitation link")
      }
    } catch {
      setError("Invalid invitation link format")
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const err = await res.text()
        throw new Error(err || "Login failed")
      }
      const data = await res.json()
      onSignIn(data.user, data.token)
    } catch (e: any) {
      setError(e.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/auth/register-by-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: inviteToken, name, email, password }),
      })
      if (!res.ok) {
        const err = await res.text()
        throw new Error(err || "Registration failed")
      }
      const data = await res.json()
      setNewUser(data.user)
      setMode("profile")
    } catch (e: any) {
      setError(e.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  async function handleProfileSetup(e: React.FormEvent) {
    e.preventDefault()
    if (!newUser) return
    
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/auth/update-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: newUser.id, profileType }),
      })
      if (!res.ok) {
        const err = await res.text()
        throw new Error(err || "Profile setup failed")
      }
      const data = await res.json()
      onSignIn({ ...newUser, profileType }, data.token)
    } catch (e: any) {
      setError(e.message || "Profile setup failed")
    } finally {
      setLoading(false)
    }
  }

  // Main landing page
  if (mode === "main") {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-6">
          {/* Logo */}
          <div className="flex items-center">
            <div className="leading-tight">
              <h1 className="text-3xl text-gray-800 tracking-wider font-bold" style={{fontFamily: 'var(--font-playfair)'}}>X Bon</h1>
              <p className="text-xs text-gray-600 tracking-wide font-light -mt-1" style={{fontFamily: 'var(--font-cormorant)'}}>Express Bonifide</p>
            </div>
          </div>
          
          {/* Sign In Button */}
          <button
            onClick={() => setMode("login")}
            className="bg-gradient-to-r from-gray-800 to-purple-900 text-white px-6 py-2 rounded-full font-medium hover:from-gray-900 hover:to-purple-800 transition-all"
          >
            Sign In
          </button>
        </header>

        {/* Main Content */}
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-serif text-gray-800 mb-4">X Bon</h2>
            <p className="text-gray-600 text-lg max-w-2xl">Exclusive access for verified professionals in luxury commodity trading</p>
          </div>

          {/* Invitation Link Input */}
          <div className="bg-gray-50 rounded-2xl p-8 w-full max-w-md border border-gray-200">
            <h3 className="text-center text-gray-700 font-medium mb-6">Paste Invitation Here</h3>
            <div className="space-y-4">
              <input
                type="url"
                placeholder="https://..."
                value={inviteLink}
                onChange={(e) => setInviteLink(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-center"
              />
              <button
                onClick={handleInviteLinkPaste}
                disabled={!inviteLink.trim()}
                className="w-full bg-gradient-to-r from-amber-600 to-amber-500 text-white py-3 rounded-lg font-medium hover:from-amber-700 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue with Invitation
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm max-w-md w-full text-center">
              {error}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Profile setup for new users
  if (mode === "profile" && newUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-50 rounded-xl p-8 border border-gray-200">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-serif text-gray-800 mb-2">Complete Your Profile</h2>
            <p className="text-gray-600">Select your role in the commodity exchange</p>
          </div>

          <form onSubmit={handleProfileSetup} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">I am a:</label>
              <div className="space-y-2">
                {[
                  { value: 'seller', label: 'Seller (Mine/Producer)' },
                  { value: 'principal', label: 'Principal (Direct Owner)' },
                  { value: 'broker', label: 'Broker (Intermediary)' },
                  { value: 'introducer', label: 'Introducer (Finder)' },
                  { value: 'buyer', label: 'Buyer (End Customer)' }
                ].map(({ value, label }) => (
                  <label key={value} className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-100 cursor-pointer">
                    <input
                      type="radio"
                      name="profileType"
                      value={value}
                      checked={profileType === value}
                      onChange={(e) => setProfileType(e.target.value as any)}
                      className="mr-3 text-amber-600"
                    />
                    <span className="text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-gray-800 to-purple-900 text-white py-3 rounded-lg font-medium hover:from-gray-900 hover:to-purple-800 disabled:opacity-50"
            >
              {loading ? "Setting up..." : "Complete Setup"}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Login form
  if (mode === "login") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <button onClick={() => setMode("main")} className="text-gray-500 hover:text-gray-700 mb-4">
              ← Back
            </button>
            <h2 className="text-2xl font-serif text-gray-800 mb-2">Welcome Back</h2>
            <p className="text-gray-600">Sign in to your account</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="email"
                required
                placeholder="Email address"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                type="password"
                required
                placeholder="Password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-gray-800 to-purple-900 text-white py-3 rounded-lg font-medium hover:from-gray-900 hover:to-purple-800 disabled:opacity-50"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setMode("google")}
              className="w-full border border-gray-300 py-3 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Registration form
  return (
    <div className="min-h-screen bg-white bg-white text-gray-900">
      {/* Top bar */}
      <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center">
          <div className="leading-tight">
            <div className="text-xl font-serif tracking-wide">X Bon</div>
            <div className="text-[11px] text-gray-500 -mt-0.5">Express Bonifide</div>
          </div>
        </div>
        <button onClick={() => setMode("login")} className="text-sm text-gray-700 hover:text-gray-900">Sign In</button>
      </div>

      {/* Main content modes */}
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Invitation Accepted</strong><br />
              Complete your registration to join Express Bonifide
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <input
              type="text"
              required
              placeholder="Full name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <input
              type="email"
              required
              placeholder="Email address"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Create password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-gray-800 to-purple-900 text-white py-3 rounded-lg font-medium hover:from-gray-900 hover:to-purple-800 disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Complete Registration"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setMode("google")}
            className="w-full border border-gray-300 py-3 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Register with Google
          </button>
        </div>
      </div>
    </div>
  )
}