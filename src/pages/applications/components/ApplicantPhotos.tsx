import { useEffect, useState } from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { X } from "lucide-react"
import { env } from "@/config/env"

function ApplicantPhotoCard({ photoPath, label }: { photoPath: string | null; label: string }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!photoPath) return
    let cancelled = false
    const token = localStorage.getItem("token")
    fetch(`${env.apiBaseUrl}${photoPath}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.blob())
      .then((blob) => {
        if (!cancelled) setBlobUrl(URL.createObjectURL(blob))
      })
      .catch(() => {})
    return () => {
      cancelled = true
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
    }
  }, [photoPath])

  return (
    <>
      <div className="flex flex-col items-center gap-1.5">
        {photoPath && blobUrl ? (
          <img
            src={blobUrl}
            alt={label}
            className="cursor-zoom-in rounded border object-cover shadow-sm"
            style={{ width: 140, height: 140 }}
            onClick={() => setIsOpen(true)}
          />
        ) : (
          <div
            className="flex items-center justify-center rounded border-2 border-dashed border-muted bg-muted/30 text-xs text-muted-foreground"
            style={{ width: 140, height: 140 }}
          >
            {photoPath ? "Loading…" : `No ${label.toLowerCase()}`}
          </div>
        )}
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>

      <DialogPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80" />
          <DialogPrimitive.Content
            aria-label={`${label} photo`}
            className="fixed inset-0 z-50 flex items-center justify-center outline-none"
            onClick={() => setIsOpen(false)}
          >
            <span className="sr-only">{label} photo</span>
            {blobUrl && (
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <img
                  src={blobUrl}
                  alt={label}
                  className="max-h-[85vh] max-w-[85vw] rounded object-contain shadow-2xl"
                />
                <button
                  className="absolute -right-4 -top-4 rounded-full bg-background p-1.5 shadow-md hover:bg-muted"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  )
}

export function ApplicantPhotos({
  portraitPhotoPath,
  passportPhotoPath,
}: {
  portraitPhotoPath: string | null
  passportPhotoPath: string | null
}) {
  return (
    <div className="mt-2 flex gap-4">
      <ApplicantPhotoCard photoPath={portraitPhotoPath} label="Portrait" />
      <ApplicantPhotoCard photoPath={passportPhotoPath} label="Passport" />
    </div>
  )
}
