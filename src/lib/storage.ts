export type ThemeChoice = "dark" | "light" | "system"
export type Affiliation = "democrat" | "republican" | "independent" | "other" | "skip"

export type Place = {
  query: string
  city: string | null
  state: string
  zip: string | null
  source: "typed" | "location"
}

const THEME = "speakup.theme"
const AFFILIATION = "speakup.affiliation"
const PLACE = "speakup.place"
const COLORBLIND = "speakup.colorblind"

function emit() {
  window.dispatchEvent(new Event("speakup-storage"))
}

function read(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function themeChoice(): ThemeChoice {
  const value = read(THEME)
  if (value === "light" || value === "dark" || value === "system") return value
  return "system"
}

export function resolvedTheme(choice = themeChoice()): "light" | "dark" {
  if (choice === "system") {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"
  }
  return choice
}

export function applyTheme(choice = themeChoice()) {
  const theme = resolvedTheme(choice)
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "light" ? "#ffffff" : "#000000")
  return theme
}

export function setTheme(choice: ThemeChoice) {
  localStorage.setItem(THEME, choice)
  applyTheme(choice)
  emit()
}

export function affiliation(): Affiliation | null {
  const value = read(AFFILIATION)
  if (
    value === "democrat" ||
    value === "republican" ||
    value === "independent" ||
    value === "other" ||
    value === "skip"
  ) {
    return value
  }
  return null
}

export function setAffiliation(value: Affiliation) {
  localStorage.setItem(AFFILIATION, value)
  emit()
}

let placeSnapshot: { raw: string | null; value: Place | null } = { raw: undefined as unknown as null, value: null }

export function place(): Place | null {
  const raw = read(PLACE)
  if (placeSnapshot.raw === raw) return placeSnapshot.value
  let value: Place | null = null
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Place
      if (parsed?.state) value = parsed
    } catch {
      value = null
    }
  }
  placeSnapshot = { raw, value }
  return value
}

export function setPlace(value: Place) {
  localStorage.setItem(PLACE, JSON.stringify(value))
  emit()
}

export function colorblind(): boolean {
  return read(COLORBLIND) === "1"
}

export function setColorblind(value: boolean) {
  localStorage.setItem(COLORBLIND, value ? "1" : "0")
  emit()
}

export function clearPersonalInfo() {
  localStorage.removeItem(AFFILIATION)
  localStorage.removeItem(PLACE)
  emit()
}

export function subscribe(callback: () => void) {
  window.addEventListener("speakup-storage", callback)
  window.addEventListener("storage", callback)
  const media = window.matchMedia("(prefers-color-scheme: light)")
  const onMedia = () => callback()
  media.addEventListener("change", onMedia)
  return () => {
    window.removeEventListener("speakup-storage", callback)
    window.removeEventListener("storage", callback)
    media.removeEventListener("change", onMedia)
  }
}
