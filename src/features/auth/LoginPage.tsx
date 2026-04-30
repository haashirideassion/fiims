import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { RiTruckLine, RiEyeLine, RiEyeOffLine } from "@remixicon/react"
import { useAuth } from "./useAuth"

export function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const result = await signIn(email, password)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      navigate("/dashboard", { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-weak-50)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[var(--color-bg-white-0)] rounded-2xl border border-[var(--color-border-soft-200)] shadow-sm p-8">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-500)] flex items-center justify-center">
              <RiTruckLine className="text-white w-5 h-5" />
            </div>
            <div>
              <p className="text-[var(--color-text-strong-950)] font-semibold text-lg leading-tight">FIIMS</p>
              <p className="text-[var(--color-text-soft-400)] text-xs">Fleet Inventory & IoT Management</p>
            </div>
          </div>

          <h1 className="text-[var(--color-text-strong-950)] text-2xl font-semibold mb-1">Sign in</h1>
          <p className="text-[var(--color-text-sub-600)] text-sm mb-6">
            Urbaser Sumeet · Greater Chennai Corporation
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-sub-600)] mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--color-border-soft-200)] bg-[var(--color-bg-white-0)] text-[var(--color-text-strong-950)] text-sm placeholder:text-[var(--color-text-soft-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent transition"
                placeholder="you@urbaser.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-sub-600)] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-[var(--color-border-soft-200)] bg-[var(--color-bg-white-0)] text-[var(--color-text-strong-950)] text-sm placeholder:text-[var(--color-text-soft-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent transition"
                  placeholder="••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-soft-400)] hover:text-[var(--color-text-sub-600)]"
                >
                  {showPassword ? <RiEyeOffLine className="w-4 h-4" /> : <RiEyeLine className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-[var(--color-error-alpha-16)] border border-[var(--color-error-alpha-24)] px-3.5 py-2.5 text-sm text-[var(--color-error-base)]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white text-sm font-medium transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
