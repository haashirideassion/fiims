import { useEffect } from "react"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { supabase } from "@/lib/supabase"
import type { AppUser, UserRole } from "@/lib/types"

interface AuthState {
  user: AppUser | null
  session: { access_token: string } | null
  loading: boolean
  setUser: (user: AppUser | null) => void
  setSession: (session: { access_token: string } | null) => void
  setLoading: (loading: boolean) => void
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      loading: true,
      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setLoading: (loading) => set({ loading }),
      signIn: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) return { error: error.message }
        if (!data.session) return { error: "No session returned" }

        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", data.user.id)
          .single()

        set({
          session: { access_token: data.session.access_token },
          user: profile as unknown as AppUser,
        })
        return {}
      },
      signOut: async () => {
        await supabase.auth.signOut()
        set({ user: null, session: null })
      },
    }),
    { name: "fiims-auth", partialize: (s) => ({ user: s.user, session: s.session }) }
  )
)

export function useAuth() {
  const { user, session, loading, setUser, setSession, setLoading, signIn, signOut } =
    useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }: { data: any }) => {
      if (data.session) {
        setSession({ access_token: data.session.access_token })
        supabase
          .from("users")
          .select("*")
          .eq("id", data.session.user.id)
          .single()
          .then(({ data: profile }: { data: any }) => {
            setUser(profile as unknown as AppUser)
            setLoading(false)
          })
      } else {
        setLoading(false)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (!session) {
        setUser(null)
        setSession(null)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [setUser, setSession, setLoading])

  const hasRole = (...roles: UserRole[]) => !!user && roles.includes(user.role)

  const canWrite = (warehouseId?: string) => {
    if (!user) return false
    if (["admin", "fleet_manager", "procurement", "finance"].includes(user.role)) return true
    if (user.role === "store_manager") {
      if (!warehouseId) return true
      return (
        user.home_warehouse_id === warehouseId ||
        user.allowed_warehouses.includes(warehouseId)
      )
    }
    if (user.role === "maintenance_lead") return true
    return false
  }

  return { user, session, loading, signIn, signOut, hasRole, canWrite }
}
