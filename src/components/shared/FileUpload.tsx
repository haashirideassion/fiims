import { useRef, useState } from "react"
import { RiUploadLine, RiFileLine, RiCloseLine } from "@remixicon/react"
import { cn } from "@/lib/utils/cn"
import { supabase } from "@/lib/supabase"

interface FileUploadProps {
  bucket: string
  path: string
  accept?: string
  multiple?: boolean
  maxFiles?: number
  maxSizeMB?: number
  onUploaded: (urls: string[]) => void
  className?: string
}

export function FileUpload({
  bucket,
  path,
  accept = "image/*",
  multiple = false,
  maxFiles = 5,
  maxSizeMB = 5,
  onUploaded,
  className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<{ name: string; url: string }[]>([])
  const [uploading, setUploading] = useState(false)

  async function handleFiles(selected: FileList | null) {
    if (!selected) return
    const list = Array.from(selected).slice(0, maxFiles)
    setUploading(true)

    const urls: string[] = []
    for (const file of list) {
      if (file.size > maxSizeMB * 1024 * 1024) continue
      const filePath = `${path}/${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from(bucket).upload(filePath, file)
      if (!error) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
        urls.push(data.publicUrl)
        setFiles((prev) => [...prev, { name: file.name, url: data.publicUrl }])
      }
    }
    onUploaded(urls)
    setUploading(false)
  }

  function removeFile(url: string) {
    setFiles((prev) => prev.filter((f) => f.url !== url))
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
        className="border-2 border-dashed border-[var(--color-border-soft-200)] rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-[var(--color-primary-500)] hover:bg-[var(--color-primary-alpha-10)] transition"
      >
        <RiUploadLine className="w-6 h-6 text-[var(--color-text-soft-400)]" />
        <p className="text-sm text-[var(--color-text-sub-600)]">
          {uploading ? "Uploading…" : "Click or drag files here"}
        </p>
        <p className="text-xs text-[var(--color-text-soft-400)]">
          Max {maxFiles} files · {maxSizeMB}MB each
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((f) => (
            <div
              key={f.url}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[var(--color-bg-weak-50)] border border-[var(--color-border-soft-200)]"
            >
              <RiFileLine className="w-4 h-4 text-[var(--color-text-soft-400)] shrink-0" />
              <span className="text-sm text-[var(--color-text-sub-600)] flex-1 truncate">{f.name}</span>
              <button
                onClick={() => removeFile(f.url)}
                className="text-[var(--color-text-soft-400)] hover:text-[var(--color-error-base)] transition"
              >
                <RiCloseLine className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
