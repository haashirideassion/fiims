import { useState } from "react"
import { RiDownloadLine } from "@remixicon/react"
import { useExport } from "@/lib/hooks/useExport"

interface ExportButtonProps {
  data: Record<string, unknown>[]
  columns: string[]
  filename: string
  title?: string
  rows?: (string | number)[][]
}

export function ExportButton({ data, columns, filename, title, rows }: ExportButtonProps) {
  const { exportExcel, exportCSV, exportPDF } = useExport()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--color-border-soft-200)] text-sm text-[var(--color-text-sub-600)] hover:bg-[var(--color-bg-soft-200)] transition"
      >
        <RiDownloadLine className="w-4 h-4" />
        Export
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-20 bg-[var(--color-bg-white-0)] border border-[var(--color-border-soft-200)] rounded-xl shadow-md py-1 w-36">
            {[
              { label: "Excel (.xlsx)", fn: () => exportExcel(data, filename) },
              { label: "CSV", fn: () => exportCSV(data, filename) },
              { label: "PDF", fn: () => rows && exportPDF(columns, rows, filename, title) },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => { item.fn(); setOpen(false) }}
                className="w-full px-3.5 py-2 text-left text-sm text-[var(--color-text-sub-600)] hover:bg-[var(--color-bg-soft-200)] transition"
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
