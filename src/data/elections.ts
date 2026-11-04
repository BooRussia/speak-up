import data from "./results2026.json"
import { byName } from "./states.ts"

export const RESULTS = data
export const UPDATED = "Nov 4, 2:30 PM ET"
export const PROJECTED_LABEL = `Projected · results still coming in · updated ${UPDATED}`

export type Race = {
  state: string
  winner: string | null
  party: string | null
  called: boolean | null
  pct: number | null
  special?: boolean
  note?: string
  source: string
  pctSource?: string
}

export const SENATE_RACES: Race[] = data.senate.races
  .map((r) => ({
    state: r.state,
    winner: r.winner,
    party: r.party,
    called: r.called,
    pct: (r as { winner_vote_pct?: number | null }).winner_vote_pct ?? null,
    special: r.special,
    note: (r as { note?: string }).note,
    source: r.source,
    pctSource: (r as { vote_pct_source?: string }).vote_pct_source,
  }))
  .sort((a, b) => a.state.localeCompare(b.state) || Number(a.special) - Number(b.special))

export const GOVERNOR_RACES: Race[] = data.governors.races
  .map((r) => ({
    state: r.state,
    winner: r.winner,
    party: r.party,
    called: r.called,
    pct: (r as { vote_pct?: number | null }).vote_pct ?? null,
    note: (r as { note?: string }).note,
    source: r.source,
  }))
  .sort((a, b) => a.state.localeCompare(b.state))

function abbrOf(name: string) {
  return byName(name)?.abbr ?? null
}

export function governorRace(abbr: string) {
  return GOVERNOR_RACES.find((r) => abbrOf(r.state) === abbr) ?? null
}

export function senateRaces(abbr: string) {
  return SENATE_RACES.filter((r) => abbrOf(r.state) === abbr)
}

export function partyLetter(p: string | null) {
  if (!p) return ""
  return p
}
