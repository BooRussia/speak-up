import { useEffect, useRef, type ReactNode } from "react"
import type { Route } from "../lib/route.ts"
import { go } from "../lib/route.ts"
import { IconGear, IconLearn, IconMap, IconPin } from "./Icons.tsx"

export function Nav({ route, onSettings }: { route: Route; onSettings: () => void }) {
  return (
    <header className="nav">
      <button className="brand" onClick={() => go("#/")}>
        Speak Up
      </button>
      <nav className="nav-links" aria-label="Primary">
        <a href="#/learn" aria-current={route.name === "learn" ? "page" : undefined}>
          Learn
        </a>
        <a href="#/area" aria-current={route.name === "area" ? "page" : undefined}>
          Area
        </a>
        <a href="#/map" aria-current={route.name === "map" ? "page" : undefined}>
          Map
        </a>
        <button type="button" onClick={onSettings}>
          Settings
        </button>
      </nav>
    </header>
  )
}

export function Tabs({ route, onSettings }: { route: Route; onSettings: () => void }) {
  return (
    <nav className="tabs" aria-label="Primary">
      <a href="#/learn" aria-current={route.name === "learn" ? "page" : undefined} aria-label="Learn">
        <IconLearn />
      </a>
      <a href="#/area" aria-current={route.name === "area" ? "page" : undefined} aria-label="Your area">
        <IconPin />
      </a>
      <a href="#/map" aria-current={route.name === "map" ? "page" : undefined} aria-label="Map">
        <IconMap />
      </a>
      <button type="button" onClick={onSettings} aria-label="Settings">
        <IconGear />
      </button>
    </nav>
  )
}

export function FinePrint() {
  return <p className="fine">Nonpartisan. No ads, no tracking. Links go to official sources.</p>
}

export function Sheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    ref.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="sheet-back" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        data-dialog-open="true"
        tabIndex={-1}
        ref={ref}
        onClick={(event) => event.stopPropagation()}
      >
        <button className="handle" type="button" onClick={onClose}>
          <span className="grab" />
          <span className="sr">Close</span>
        </button>
        <h2 id="sheet-title">{title}</h2>
        {children}
      </div>
    </div>
  )
}
