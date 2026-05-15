import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { RiSearchLine, RiLoader4Line, RiCloseLine } from "@remixicon/react"

type ResultType = "part" | "vehicle" | "vendor" | "warehouse"

interface SearchResult {
  id: string
  label: string
  sublabel?: string
  type: ResultType
  href: string
}

const TYPE_LABELS: Record<ResultType, string> = {
  part: "Parts",
  vehicle: "Vehicles",
  vendor: "Vendors",
  warehouse: "Warehouses",
}

const TYPE_ORDER: ResultType[] = ["part", "vehicle", "vendor", "warehouse"]

async function runSearch(q: string): Promise<SearchResult[]> {
  const term = q.trim()
  const [parts, vehicles, vendors, warehouses] = await Promise.all([
    supabase
      .from("spare_parts")
      .select("id, sku, name")
      .or(`name.ilike.%${term}%,sku.ilike.%${term}%`)
      .limit(5),
    supabase
      .from("vehicles")
      .select("id, reg_no, chassis_no")
      .or(`reg_no.ilike.%${term}%,chassis_no.ilike.%${term}%`)
      .limit(5),
    supabase
      .from("vendors")
      .select("id, legal_name, gstin")
      .ilike("legal_name", `%${term}%`)
      .limit(5),
    supabase
      .from("warehouses")
      .select("id, name")
      .ilike("name", `%${term}%`)
      .limit(5),
  ])

  const results: SearchResult[] = []

  for (const p of parts.data ?? []) {
    results.push({ id: p.id, label: p.name, sublabel: p.sku, type: "part", href: `/master/parts/${p.id}` })
  }
  for (const v of vehicles.data ?? []) {
    results.push({ id: v.id, label: v.reg_no, sublabel: v.chassis_no ?? undefined, type: "vehicle", href: `/master/vehicles/${v.id}` })
  }
  for (const v of vendors.data ?? []) {
    results.push({ id: v.id, label: v.legal_name, sublabel: v.gstin ?? undefined, type: "vendor", href: `/master/vendors/${v.id}` })
  }
  for (const w of warehouses.data ?? []) {
    results.push({ id: w.id, label: w.name, type: "warehouse", href: `/master/warehouses/${w.id}` })
  }

  return results
}

export function GlobalSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(t)
  }, [query])

  // Close on outside click
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [])

  const enabled = debouncedQuery.trim().length >= 2

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["global-search", debouncedQuery],
    queryFn: () => runSearch(debouncedQuery),
    enabled,
    staleTime: 30_000,
  })

  // Build grouped + flat list in consistent order for keyboard nav
  const grouped = TYPE_ORDER.reduce<{ type: ResultType; items: SearchResult[] }[]>((acc, type) => {
    const items = results.filter((r) => r.type === type)
    if (items.length) acc.push({ type, items })
    return acc
  }, [])

  const flatItems = grouped.flatMap((g) => g.items)

  // Reset focused index when results change
  useEffect(() => setFocusedIndex(-1), [results])

  function handleSelect(result: SearchResult) {
    setQuery("")
    setDebouncedQuery("")
    setOpen(false)
    navigate(result.href)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setFocusedIndex((i) => Math.min(i + 1, flatItems.length - 1))
        break
      case "ArrowUp":
        e.preventDefault()
        setFocusedIndex((i) => Math.max(i - 1, 0))
        break
      case "Enter":
        if (focusedIndex >= 0 && flatItems[focusedIndex]) {
          e.preventDefault()
          handleSelect(flatItems[focusedIndex])
        }
        break
      case "Escape":
        setOpen(false)
        inputRef.current?.blur()
        break
    }
  }

  const showDropdown = open && query.trim().length > 0

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2 bg-[var(--color-bg-weak-50)] rounded-lg px-3 py-1.5 w-64">
        {isFetching ? (
          <RiLoader4Line className="w-4 h-4 text-[var(--color-text-soft-400)] animate-spin shrink-0" />
        ) : (
          <RiSearchLine className="w-4 h-4 text-[var(--color-text-soft-400)] shrink-0" />
        )}
        <input
          ref={inputRef}
          value={query}
          placeholder="Search parts, vehicles…"
          className="bg-transparent text-sm text-[var(--color-text-strong-950)] placeholder:text-[var(--color-text-soft-400)] focus:outline-none flex-1 min-w-0"
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => {
            if (query.trim().length > 0) setOpen(true)
          }}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => {
              setQuery("")
              setDebouncedQuery("")
              setOpen(false)
              inputRef.current?.focus()
            }}
            className="text-[var(--color-text-soft-400)] hover:text-[var(--color-text-sub-600)] shrink-0"
          >
            <RiCloseLine className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full mt-1.5 left-0 w-80 bg-[var(--color-bg-white-0)] border border-[var(--color-border-soft-200)] rounded-xl shadow-lg z-50 overflow-hidden">
          {query.trim().length < 2 ? (
            <p className="px-4 py-3 text-xs text-[var(--color-text-soft-400)]">Type at least 2 characters…</p>
          ) : isFetching ? (
            <div className="px-4 py-3 flex items-center gap-2 text-xs text-[var(--color-text-soft-400)]">
              <RiLoader4Line className="w-3 h-3 animate-spin" /> Searching…
            </div>
          ) : grouped.length === 0 ? (
            <p className="px-4 py-3 text-xs text-[var(--color-text-soft-400)]">No results found for "{query}"</p>
          ) : (
            <div className="py-1.5 max-h-80 overflow-y-auto">
              {grouped.map(({ type, items }) => (
                <div key={type}>
                  <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-soft-400)]">
                    {TYPE_LABELS[type]}
                  </p>
                  {items.map((result) => {
                    const idx = flatItems.indexOf(result)
                    return (
                      <button
                        key={result.id}
                        type="button"
                        onPointerDown={(e) => {
                          e.preventDefault()
                          handleSelect(result)
                        }}
                        className={`w-full text-left px-3 py-2 flex flex-col gap-0.5 transition ${
                          idx === focusedIndex
                            ? "bg-[var(--color-primary-alpha-16)]"
                            : "hover:bg-[var(--color-bg-weak-50)]"
                        }`}
                      >
                        <span className="text-sm text-[var(--color-text-strong-950)] truncate">{result.label}</span>
                        {result.sublabel && (
                          <span className="text-xs text-[var(--color-text-soft-400)] truncate">{result.sublabel}</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
