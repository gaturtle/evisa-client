// PROTOTYPE — throwaway variant switcher. Do not ship to production.
// The app has no router (App.tsx drives navigation from component state), so the
// `variant` param is read/written directly against `window.location` search params.
import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, FlaskConical } from "lucide-react"

export function useVariantParam(defaultVariant: string) {
  const [variant, setVariantState] = useState(
    () => new URLSearchParams(window.location.search).get("variant") ?? defaultVariant
  )

  useEffect(() => {
    function onPopState() {
      setVariantState(new URLSearchParams(window.location.search).get("variant") ?? defaultVariant)
    }
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [defaultVariant])

  function setVariant(next: string) {
    const params = new URLSearchParams(window.location.search)
    params.set("variant", next)
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`)
    setVariantState(next)
  }

  return [variant, setVariant] as const
}

interface PrototypeSwitcherProps {
  variants: { key: string; label: string }[]
  current: string
  onChange: (key: string) => void
}

export function PrototypeSwitcher({ variants, current, onChange }: PrototypeSwitcherProps) {
  const isProd = import.meta.env.PROD

  useEffect(() => {
    if (isProd) return
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      const isTyping =
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      if (isTyping) return
      if (e.key === "ArrowLeft") cycle(-1)
      if (e.key === "ArrowRight") cycle(1)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, variants])

  function cycle(direction: 1 | -1) {
    const idx = variants.findIndex((v) => v.key === current)
    const nextIdx = (idx + direction + variants.length) % variants.length
    onChange(variants[nextIdx].key)
  }

  const currentEntry = variants.find((v) => v.key === current) ?? variants[0]

  if (isProd) return null

  return (
    <div className="fixed bottom-4 left-1/2 z-100 flex -translate-x-1/2 items-center gap-1 rounded-full border border-foreground/10 bg-foreground text-background shadow-2xl">
      <button
        onClick={() => cycle(-1)}
        className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-background/10"
        aria-label="Previous variant"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-1.5 px-1 text-xs font-medium">
        <FlaskConical className="h-3.5 w-3.5 opacity-70" />
        <span className="opacity-70">{currentEntry.key}</span>
        <span>—</span>
        <span>{currentEntry.label}</span>
      </div>
      <button
        onClick={() => cycle(1)}
        className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-background/10"
        aria-label="Next variant"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
