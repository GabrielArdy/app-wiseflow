import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"
import api from "@/lib/axios"
import { useAuthStore } from "@/stores/auth-store"
import type { TokenPair, User } from "@/types/api"

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await api.post<{ data: TokenPair }>("/auth/login", { email, password })
      const { access_token } = res.data.data

      const me = await api.get<{ data: User }>("/api/v1/auth/me", {
        headers: { Authorization: `Bearer ${access_token}` },
      }).catch(() => null)

      const user: User = me?.data.data ?? { id: "", email, full_name: "", created_at: "" }
      setAuth(user, access_token)
      navigate("/dashboard", { replace: true })
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Something went wrong. Try again.")
      } else {
        setError("Something went wrong. Check your connection and try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logoMark}>W</div>
        <h1 style={styles.brand}>WiseFlow</h1>
        <p style={styles.tagline}>Your money, flowing freely.</p>
      </div>

      {/* Form card */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Welcome back</h2>
        <p style={styles.cardSubtitle}>Sign in to your account</p>

        {error && (
          <div style={styles.errorBanner} role="alert">
            {error}
          </div>
        )}

        <form onSubmit={(e) => { void handleSubmit(e) }} style={styles.form} noValidate>
          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              style={styles.input}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value) }}
              required
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              style={styles.input}
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value) }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.btn,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p style={styles.footerText}>
          Don't have an account?{" "}
          <Link to="/register" style={styles.link}>Create one</Link>
        </p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100dvh",
    backgroundColor: "var(--wf-neutral-50)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 16px",
    paddingTop: "env(safe-area-inset-top)",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: "32px",
    gap: "8px",
  },
  logoMark: {
    width: "56px",
    height: "56px",
    borderRadius: "16px",
    background: "linear-gradient(135deg, var(--wf-primary-900), var(--wf-primary))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: "24px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: 700,
    boxShadow: "var(--wf-shadow-primary)",
  },
  brand: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: "26px",
    fontWeight: 700,
    color: "var(--wf-neutral-900)",
    margin: 0,
  },
  tagline: {
    fontSize: "14px",
    color: "var(--wf-neutral-500)",
    margin: 0,
  },
  card: {
    width: "100%",
    maxWidth: "400px",
    backgroundColor: "var(--wf-white)",
    borderRadius: "var(--wf-radius-xl)",
    padding: "32px 24px",
    boxShadow: "var(--wf-shadow-lg)",
  },
  cardTitle: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: "22px",
    fontWeight: 700,
    color: "var(--wf-neutral-900)",
    marginBottom: "4px",
  },
  cardSubtitle: {
    fontSize: "14px",
    color: "var(--wf-neutral-500)",
    marginBottom: "24px",
    margin: "0 0 24px",
  },
  errorBanner: {
    backgroundColor: "#FEF2F2",
    border: "1px solid #FECACA",
    borderRadius: "var(--wf-radius-md)",
    padding: "12px 14px",
    fontSize: "14px",
    color: "var(--wf-danger)",
    marginBottom: "20px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 500,
    color: "var(--wf-neutral-700)",
  },
  input: {
    height: "52px",
    borderRadius: "var(--wf-radius-md)",
    border: "1.5px solid var(--wf-neutral-300)",
    padding: "0 14px",
    fontSize: "16px",
    color: "var(--wf-neutral-900)",
    backgroundColor: "var(--wf-white)",
    outline: "none",
    transition: "border-color 150ms ease",
    width: "100%",
    fontFamily: "Inter, sans-serif",
  },
  btn: {
    height: "52px",
    borderRadius: "var(--wf-radius-md)",
    background: "linear-gradient(135deg, var(--wf-primary), var(--wf-primary-700))",
    color: "white",
    fontSize: "16px",
    fontWeight: 600,
    border: "none",
    width: "100%",
    marginTop: "4px",
    boxShadow: "var(--wf-shadow-primary)",
    transition: "transform 100ms ease, opacity 150ms ease",
    fontFamily: "Inter, sans-serif",
  },
  footerText: {
    textAlign: "center",
    fontSize: "14px",
    color: "var(--wf-neutral-500)",
    marginTop: "20px",
    marginBottom: 0,
  },
  link: {
    color: "var(--wf-primary)",
    fontWeight: 600,
    textDecoration: "none",
  },
}
