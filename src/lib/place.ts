import { STATES, byAbbr, byName } from "../data/states.ts"
import { stateFromZip } from "../data/zip3.ts"

export type ParsedPlace =
  | { ok: true; city: string | null; state: string; zip: string | null }
  | { ok: false; message: string }

export function parsePlace(input: string): ParsedPlace {
  const query = input.trim().replace(/\s+/g, " ")
  if (!query) return { ok: false, message: "Enter a city and state, or a ZIP code." }

  if (/^\d{5}(?:-\d{4})?$/.test(query)) {
    const hit = stateFromZip(query)
    if (hit.kind === "state" && byAbbr(hit.state)) {
      return { ok: true, city: null, state: hit.state, zip: query.slice(0, 5) }
    }
    if (hit.kind === "military") {
      return { ok: false, message: "That ZIP is for military mail. Enter a city and state instead." }
    }
    return { ok: false, message: "That ZIP is not in the state prefix table. Try a city and state, like Ocala, FL." }
  }

  const comma = query.match(/^(.+),\s*([A-Za-z]{2})$/)
  if (comma) {
    const abbr = comma[2].toUpperCase()
    if (!byAbbr(abbr)) return { ok: false, message: "Use a two-letter state code, like Austin, TX." }
    return { ok: true, city: comma[1].trim(), state: abbr, zip: null }
  }

  const named = byName(query)
  if (named) return { ok: true, city: null, state: named.abbr, zip: null }

  const tail = query.match(/^(.+)\s+([A-Za-z]{2})$/)
  if (tail && byAbbr(tail[2].toUpperCase())) {
    return { ok: true, city: tail[1].trim(), state: tail[2].toUpperCase(), zip: null }
  }

  const stateWord = STATES.find((state) => query.toLowerCase() === state.name.toLowerCase())
  if (stateWord) return { ok: true, city: null, state: stateWord.abbr, zip: null }

  return { ok: false, message: "Add a state, like Ocala, FL, or enter a 5-digit ZIP." }
}
