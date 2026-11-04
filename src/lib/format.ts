export function telHref(phone: string) {
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 10) return `tel:+1${digits}`
  if (digits.length === 11) return `tel:+${digits}`
  return `tel:${digits}`
}

export function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, "")
  const local = digits.length === 11 ? digits.slice(1) : digits
  if (local.length !== 10) return phone
  return `(${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`
}

export function initials(name: string) {
  const skip = new Set(["jr", "sr", "ii", "iii", "iv"])
  const parts = name
    .replace(/[.,]/g, "")
    .split(/\s+/)
    .filter((part) => part && !skip.has(part.toLowerCase()))
  const first = parts[0]?.[0] ?? ""
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : ""
  return `${first}${last}`.toUpperCase()
}

export function votes(value: number) {
  return value.toLocaleString("en-US")
}

export function compactCount(value: number) {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) {
    const millions = value / 1_000_000
    const digits = abs >= 10_000_000 ? 0 : 1
    return `${millions.toFixed(digits).replace(/\.0$/, "")}M`
  }
  if (abs >= 1_000) return `${Math.round(value / 1_000)}K`
  return value.toLocaleString("en-US")
}

export function bandLabel(index: number, edges: number[]) {
  if (edges.length < 4) return ""
  if (index <= 0) return `≤ ${compactCount(edges[0])}`
  if (index >= 4) return `> ${compactCount(edges[3])}`
  return `${compactCount(edges[index - 1])}–${compactCount(edges[index])}`
}

export function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

export function points(value: number) {
  return `${(value * 100).toFixed(1)} pts`
}

export function partyWord(code: string) {
  if (code === "D") return "Democrat"
  if (code === "R") return "Republican"
  if (code === "T") return "Toss-up"
  if (code === "I") return "Independent"
  if (code === "V") return "Not listed"
  return "Other"
}
