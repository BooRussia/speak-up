/**
 * Convert unitedstates/congress-legislators legislators-current into a slim
 * JSON file for Speak Up.
 *
 * The "current" test is a term that contains 2026-11-04. Seats with no such
 * term are reported as not listed. This script does not guess a successor.
 *
 * If the download fails, pass --sample to write a tiny fake roster.
 */
import { writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const outPath = resolve(root, "src/data/generated/congress.json")
const URL_CURRENT = "https://unitedstates.github.io/congress-legislators/legislators-current.json"
const AS_OF = "2026-11-04"

const APPORTION: Record<string, number> = {
  AL: 7, AK: 1, AZ: 9, AR: 4, CA: 52, CO: 8, CT: 5, DE: 1, FL: 28, GA: 14,
  HI: 2, ID: 2, IL: 17, IN: 9, IA: 4, KS: 4, KY: 6, LA: 6, ME: 2, MD: 8,
  MA: 9, MI: 13, MN: 8, MS: 4, MO: 8, MT: 2, NE: 3, NV: 4, NH: 2, NJ: 12,
  NM: 3, NY: 26, NC: 14, ND: 1, OH: 15, OK: 5, OR: 6, PA: 17, RI: 2, SC: 7,
  SD: 1, TN: 9, TX: 38, UT: 4, VT: 1, VA: 11, WA: 10, WV: 2, WI: 8, WY: 1,
}

type Term = {
  type: string
  start: string
  end: string
  state: string
  district?: number
  class?: number
  state_rank?: string
  party?: string
  caucus?: string
  url?: string
  contact_form?: string
  phone?: string
}

type Person = {
  name: { official_full?: string; first?: string; last: string }
  terms: Term[]
}

type Official = {
  name: string
  party: string
  caucus: string | null
  phone: string | null
  contact: string | null
  url: string | null
  district: number | null
  rank: string | null
}

const active = (term: Term) => term.start <= AS_OF && AS_OF < term.end

function official(person: Person, term: Term): Official {
  return {
    name: person.name.official_full || `${person.name.first ?? ""} ${person.name.last}`.trim(),
    party: term.party || "Unknown",
    caucus: term.caucus ?? null,
    phone: term.phone ?? null,
    contact: term.contact_form ?? term.url ?? null,
    url: term.url ?? null,
    district: typeof term.district === "number" ? term.district : null,
    rank: term.state_rank ?? null,
  }
}

function sample() {
  return {
    sample: true,
    source: "SAMPLE roster for layout, not real officeholders",
    fetched: AS_OF,
    senate: { democrat: 1, republican: 1, independent: 0, unlisted: 98, total: 100 },
    house: { democrat: 1, republican: 1, independent: 0, unlisted: 433, total: 435 },
    independents: [],
    unlistedSenate: [],
    unlistedHouse: [],
    byState: {
      FL: {
        senators: [
          {
            name: "Sample Senator",
            party: "Independent",
            caucus: null,
            phone: "202-224-3121",
            contact: "https://www.senate.gov/senators/senators-contact.htm",
            url: "https://www.senate.gov/",
            district: null,
            rank: "senior",
          },
        ],
        representatives: [],
        delegate: null,
      },
    },
  }
}

async function main() {
  if (process.argv.includes("--sample")) {
    writeFileSync(outPath, JSON.stringify(sample()))
    console.log("wrote SAMPLE congress")
    return
  }

  const res = await fetch(URL_CURRENT)
  if (!res.ok) throw new Error(`legislators download failed: ${res.status}`)
  const people = (await res.json()) as Person[]

  const byState: Record<string, { senators: Official[]; representatives: Official[]; delegate: Official | null }> = {}
  const ensure = (state: string) => {
    byState[state] ??= { senators: [], representatives: [], delegate: null }
    return byState[state]
  }

  const counts = {
    senate: { democrat: 0, republican: 0, independent: 0 },
    house: { democrat: 0, republican: 0, independent: 0 },
  }
  const independents: { name: string; state: string; chamber: string; caucus: string | null; district: number | null }[] = []
  const seenHouse = new Map<string, Set<number>>()

  for (const person of people) {
    const term = [...person.terms].reverse().find(active)
    if (!term) continue
    const row = official(person, term)
    if (term.type === "sen") {
      ensure(term.state).senators.push(row)
      if (term.party === "Democrat") counts.senate.democrat++
      else if (term.party === "Republican") counts.senate.republican++
      else {
        counts.senate.independent++
        independents.push({
          name: row.name,
          state: term.state,
          chamber: "Senate",
          caucus: row.caucus,
          district: null,
        })
      }
    } else if (term.type === "rep" && term.state in APPORTION && typeof term.district === "number") {
      ensure(term.state).representatives.push(row)
      const set = seenHouse.get(term.state) ?? new Set<number>()
      set.add(term.district)
      seenHouse.set(term.state, set)
      if (term.party === "Democrat") counts.house.democrat++
      else if (term.party === "Republican") counts.house.republican++
      else {
        counts.house.independent++
        independents.push({
          name: row.name,
          state: term.state,
          chamber: "House",
          caucus: row.caucus,
          district: term.district,
        })
      }
    } else if (term.type === "rep" && !(term.state in APPORTION)) {
      ensure(term.state).delegate = row
    }
  }

  const unlistedHouse: string[] = []
  for (const [state, n] of Object.entries(APPORTION)) {
    const have = seenHouse.get(state) ?? new Set<number>()
    if (n === 1 && have.has(0)) continue
    for (let district = 1; district <= n; district++) {
      if (!have.has(district)) unlistedHouse.push(`${state}-${district}`)
    }
  }

  const unlistedSenate: string[] = []
  for (const state of Object.keys(APPORTION)) {
    const have = byState[state]?.senators.length ?? 0
    for (let i = have; i < 2; i++) unlistedSenate.push(state)
  }

  for (const state of Object.keys(byState)) {
    byState[state].senators.sort((a, b) => {
      if (a.rank === "senior" && b.rank !== "senior") return -1
      if (b.rank === "senior" && a.rank !== "senior") return 1
      return a.name.localeCompare(b.name)
    })
    byState[state].representatives.sort((a, b) => (a.district ?? 0) - (b.district ?? 0))
  }

  const senateListed = counts.senate.democrat + counts.senate.republican + counts.senate.independent
  const houseListed = counts.house.democrat + counts.house.republican + counts.house.independent

  const data = {
    sample: false,
    source: "unitedstates/congress-legislators legislators-current",
    sourceUrl: "https://unitedstates.github.io/congress-legislators/legislators-current.json",
    fetched: AS_OF,
    senate: { ...counts.senate, unlisted: 100 - senateListed, total: 100 },
    house: { ...counts.house, unlisted: 435 - houseListed, total: 435 },
    independents,
    unlistedSenate,
    unlistedHouse,
    byState,
  }

  if (data.senate.unlisted !== unlistedSenate.length) {
    console.warn("senate unlisted mismatch", data.senate.unlisted, unlistedSenate)
  }
  if (data.house.unlisted !== unlistedHouse.length) {
    console.warn("house unlisted mismatch", data.house.unlisted, unlistedHouse.length, unlistedHouse)
  }

  writeFileSync(outPath, JSON.stringify(data))
  console.log(JSON.stringify({ senate: data.senate, house: data.house, unlistedSenate, unlistedHouse, independents }, null, 2))
}

main().catch((error: unknown) => {
  console.error(error)
  console.error("Refusing to overwrite with sample data. Re-run with --sample if you need a fake roster.")
  process.exit(1)
})
