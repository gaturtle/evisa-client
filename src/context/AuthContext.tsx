import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { parseJwt } from "@/lib/parseJwt"
import { authCallbacks } from "@/lib/authCallbacks"

interface AuthState {
  token: string | null
  role: string | null
  email: string | null
}

interface AuthContextValue extends AuthState {
  login: (token: string, role: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(() => {
    const token = localStorage.getItem("token")
    const role = localStorage.getItem("role")
    const email = token
      ? ((parseJwt(token)["email"] ?? parseJwt(token)["Email"]) as string | null)
      : null
    return { token, role, email }
  })

  const logout = useCallback(() => {
    localStorage.removeItem("token")
    localStorage.removeItem("role")
    setAuth({ token: null, role: null, email: null })
  }, [])

  const login = useCallback((token: string, role: string) => {
    localStorage.setItem("token", token)
    localStorage.setItem("role", role)
    const payload = parseJwt(token)
    const email = (payload["email"] ?? payload["Email"]) as string | null
    setAuth({ token, role, email })
  }, [])

  // Register the logout callback so Axios interceptors can trigger it.
  useEffect(() => {
    authCallbacks.logout = logout
    return () => {
      authCallbacks.logout = null
    }
  }, [logout])

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
