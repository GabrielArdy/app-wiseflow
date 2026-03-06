import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"
import api from "@/lib/axios"
import { useAuthStore } from "@/stores/auth-store"
import type { User } from "@/types/api"

export default function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    setError(null)
    setLoading(true)

    try {
      const registerRes = await api.post<{ data: User }>("/auth/register", {
        email,
        password,
        full_name: fullName,
      })
      const user = registerRes.data.data

      const loginRes = await api.post<{ data: { access_token: string } }>("/auth/login", {
        email,
        password,
      })
      setAuth(user, loginRes.data.data.access_token)
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
      <div style={styles.header}>
        <div style={styles.logoMark}>W</div>
        <h1 style={styles.brand}>WiseFlow</h1>
        <p style={styles.tagline}>Start your journey to financial clarity.</p>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Create your account</h2>
        <p style={styles.cardSubtitle}>It only takes a minute</p>

        {error && (
          <div style={styles.errorBanner} role="alert">
            {error}
          </div>
        )}

        <form onSubmit={(e) => { void handleSubmit(e) }} style={styles.form} noValidate>
          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="fullName">Full name</label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              style={styles.input}
              placeholder="Alex Johnson"
              value={fullName}
              onChange={(e) => { setFullName(e.target.value) }}
              required
            />
          </div>

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
            <label style={styles.label} htmlFor="password">
              Password
              <span style={{ color: "var(--wf-neutral-500)", fontWeight: 400, marginLeft: "6px" }}>
                (min. 8 characters)
              </span>
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              style={styles.input}
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value) }}
              required
              minLength={8}
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
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p style={styles.footerText}>
          Already have an account?{" "}
          <Link to="/login" style={styles.link}>Sign in</Link>
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
