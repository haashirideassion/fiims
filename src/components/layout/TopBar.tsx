import { RiBellLine, RiGlobalLine } from "@remixicon/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/features/auth/useAuth"
import { GlobalSearch } from "./GlobalSearch"

export function TopBar() {
  const { user } = useAuth()
  const { i18n } = useTranslation()
  const [lang, setLang] = useState(i18n.language)

  function toggleLang() {
    const next = lang === "en" ? "ta" : "en"
    i18n.changeLanguage(next)
    setLang(next)
  }

  return (
    <header className="h-14 bg-[var(--color-bg-white-0)] border-b border-[var(--color-border-soft-200)] flex items-center justify-between px-4 shrink-0">
      <GlobalSearch />

      <div className="flex items-center gap-2">
        {/* Language toggle — only for store_manager and maintenance_lead */}
        {user && ["store_manager", "maintenance_lead"].includes(user.role) && (
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-[var(--color-text-sub-600)] hover:bg-[var(--color-bg-soft-200)] transition"
          >
            <RiGlobalLine className="w-4 h-4" />
            <span className="text-xs font-medium">{lang === "en" ? "தமிழ்" : "English"}</span>
          </button>
        )}

        {/* Notifications */}
        <button className="relative w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-sub-600)] hover:bg-[var(--color-bg-soft-200)] transition">
          <RiBellLine className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[var(--color-error-base)] rounded-full" />
        </button>

        {/* Avatar */}
        {user && (
          <div className="w-8 h-8 rounded-full bg-[var(--color-primary-alpha-16)] flex items-center justify-center">
            <span className="text-xs font-semibold text-[var(--color-primary-500)]">
              {user.name?.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </header>
  )
}
