export type Route =
  | { name: "home" }
  | { name: "learn" }
  | { name: "area" }
  | { name: "notfound" }
  | { name: "map"; state: string | null; county: string | null }

export function parseHash(hash: string): Route {
  const parts = (hash.replace(/^#/, "") || "/").split("/").filter(Boolean)
  if (parts[0] === "learn") return { name: "learn" }
  if (parts[0] === "area") return { name: "area" }
  if (parts[0] === "map") {
    return {
      name: "map",
      state: parts[1] ? parts[1].toUpperCase() : null,
      county: parts[2] ? decodeURIComponent(parts[2].replace(/\+/g, " ")) : null,
    }
  }
  if (parts.length === 0) return { name: "home" }
  return { name: "notfound" }
}

export function go(hash: string) {
  if (window.location.hash !== hash) window.location.hash = hash
}

export function mapHash(state?: string | null, county?: string | null) {
  if (!state) return "#/map"
  if (!county) return `#/map/${state}`
  return `#/map/${state}/${encodeURIComponent(county)}`
}
