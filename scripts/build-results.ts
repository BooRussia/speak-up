/**
 * Build county and state election results keyed by FIPS.
 *
 * Sources (fetched at build time):
 * - MIT Election Data and Science Lab county presidential returns, via the
 *   electiondata.dev CSV mirror of Harvard Dataverse doi:10.7910/DVN/VOQCHQ
 * - MIT Election Data and Science Lab 2024 Senate county file
 *
 * Governor and U.S. House are not in these county files. This script does not
 * invent them. If a download fails, pass --sample to write a clearly fake
 * layout file. Never mix sample rows with real rows.
 */
import { writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const outPath = resolve(root, "src/data/generated/results.json")

const PRESIDENT_URL = "https://api.electiondata.dev/v1/county-president/table/2024.csv"
const SENATE_URL =
  "https://raw.githubusercontent.com/MEDSL/2024-elections-official/master/2024-senate-county.csv"

type Side = "D" | "R" | "O" | "T"

type Unit = {
  winner: Side
  leader: "D" | "R" | "O"
  d: number
  r: number
  o: number
  total: number
  share: number
  margin: number
  name?: string
  unofficial?: boolean
}

type Tally = {
  d: number
  r: number
  o: number
  reported: number
  name: string
  unofficial: boolean
}

const empty = (name = ""): Tally => ({
  d: 0,
  r: 0,
  o: 0,
  reported: 0,
  name,
  unofficial: false,
})

function add(t: Tally, party: string, votes: number, reported: number, unofficial = false) {
  const p = party.toUpperCase()
  if (p === "DEMOCRAT") t.d += votes
  else if (p === "REPUBLICAN") t.r += votes
  else t.o += votes
  if (reported > t.reported) t.reported = reported
  if (unofficial) t.unofficial = true
}

function finalize(t: Tally): Unit {
  const total = t.d + t.r + t.o
  const ranked = [
    ["D", t.d],
    ["R", t.r],
    ["O", t.o],
  ] as const
  const sorted = [...ranked].sort((a, b) => b[1] - a[1])
  const leader = sorted[0][0]
  const first = sorted[0][1]
  const second = sorted[1][1]
  const margin = total > 0 ? (first - second) / total : 0
  const share = total > 0 ? first / total : 0
  const tossup = leader !== "O" && first > 0 && margin < 0.005
  const winner: Side = first === 0 ? "O" : tossup ? "T" : leader
  const unit: Unit = { winner, leader, d: t.d, r: t.r, o: t.o, total, share, margin }
  if (t.name) unit.name = t.name
  if (t.unofficial) unit.unofficial = true
  return unit
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/\bOf\b/g, "of")
    .replace(/\bAnd\b/g, "and")
}

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"'
          i++
        } else quoted = false
      } else cell += c
      continue
    }
    if (c === '"') quoted = true
    else if (c === ",") {
      row.push(cell)
      cell = ""
    } else if (c === "\n") {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ""
    } else if (c !== "\r") cell += c
  }
  if (cell.length || row.length) {
    row.push(cell)
    rows.push(row)
  }
  const headers = rows.shift()
  if (!headers) return []
  return rows
    .filter((r) => r.some((v) => v.length > 0))
    .map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])))
}

async function fetchText(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} returned ${res.status}`)
  return res.text()
}

function sampleFile() {
  const unit = (d: number, r: number, name: string): Unit =>
    finalize({ d, r, o: 10, reported: d + r + 10, name, unofficial: false })
  return {
    sample: true,
    sampleBanner: "Sample data for layout, not real results",
    presidential: {
      source: "SAMPLE — not an election result",
      asOf: "sample",
      url: "",
      states: { FL: unit(40, 60, "Florida"), CA: unit(70, 30, "California") },
      counties: { "12083": unit(45, 55, "Marion") },
      unmapped: {},
    },
    senate: {
      source: "SAMPLE — not an election result",
      asOf: "sample",
      url: "",
      states: { FL: unit(48, 52, "Florida") },
      counties: { "12083": unit(49, 51, "Marion") },
      notes: {},
    },
  }
}

function write(data: unknown) {
  writeFileSync(outPath, JSON.stringify(data))
  console.log(`wrote ${outPath}`)
}

async function main() {
  if (process.argv.includes("--sample")) {
    write(sampleFile())
    console.log("wrote SAMPLE results")
    return
  }

  const [presidentCsv, senateCsv] = await Promise.all([
    fetchText(PRESIDENT_URL),
    fetchText(SENATE_URL),
  ])
  const presidentRows = parseCsv(presidentCsv)
  const senateRows = parseCsv(senateCsv)

  const pStates = new Map<string, Tally>()
  const pCounties = new Map<string, Tally>()
  const unmappedUnits = new Map<string, Set<string>>()
  let asOf = ""

  for (const row of presidentRows) {
    const st = row.state_po
    const votes = Number(row.candidatevotes || 0)
    const reported = Number(row.totalvotes || 0)
    if (!st || Number.isNaN(votes)) continue
    if (!asOf && row.version) asOf = row.version
    const state = pStates.get(st) ?? empty(titleCase(row.state))
    add(state, row.party, votes, reported)
    pStates.set(st, state)
    const fips = (row.county_fips || "").padStart(5, "0")
    if (!row.county_fips) {
      const set = unmappedUnits.get(st) ?? new Set<string>()
      set.add(row.unit_id || row.county_name)
      unmappedUnits.set(st, set)
      continue
    }
    const county = pCounties.get(fips) ?? empty(titleCase(row.county_name))
    add(county, row.party, votes, reported)
    pCounties.set(fips, county)
  }

  const specialStates = new Set<string>()
  const regularStates = new Set<string>()
  for (const row of senateRows) {
    if (row.special === "TRUE") specialStates.add(row.state_po)
    else regularStates.add(row.state_po)
  }
  const both = new Set([...specialStates].filter((st) => regularStates.has(st)))

  const sStates = new Map<string, Tally>()
  const sCounties = new Map<string, Tally>()
  const notes: Record<string, string> = {}
  let senateVersion = ""

  for (const row of senateRows) {
    const st = row.state_po
    if (!st) continue
    if (both.has(st) && row.special === "TRUE") continue
    if (!senateVersion && row.version) senateVersion = row.version
    const votes = Number(row.votes || 0)
    const reported = Number(row.totalvotes || 0)
    const unofficial = row.unofficial === "TRUE"
    const state = sStates.get(st) ?? empty(titleCase(row.state))
    add(state, row.party_simplified || row.party_detailed, votes, reported, unofficial)
    sStates.set(st, state)
    if (!row.county_fips) continue
    const fips = row.county_fips.padStart(5, "0")
    const county = sCounties.get(fips) ?? empty(titleCase(row.county_name))
    add(county, row.party_simplified || row.party_detailed, votes, reported, unofficial)
    sCounties.set(fips, county)
  }

  for (const st of both) {
    notes[st] =
      "This fill is the regular 2024 Senate election. A special election was held the same day and is not drawn on this map."
  }

  const toRecord = (map: Map<string, Tally>) =>
    Object.fromEntries([...map.entries()].map(([k, v]) => [k, finalize(v)]))

  write({
    sample: false,
    presidential: {
      source:
        "MIT Election Data and Science Lab, County Presidential Election Returns 2000-2024, Harvard Dataverse, doi:10.7910/DVN/VOQCHQ",
      asOf: asOf || "unknown",
      url: "https://doi.org/10.7910/DVN/VOQCHQ",
      states: toRecord(pStates),
      counties: toRecord(pCounties),
      unmapped: Object.fromEntries([...unmappedUnits.entries()].map(([st, set]) => [st, set.size])),
    },
    senate: {
      source:
        "MIT Election Data and Science Lab, 2024 U.S. Senate county returns (2024-elections-official/2024-senate-county.csv)",
      asOf: senateVersion || "2024",
      url: "https://github.com/MEDSL/2024-elections-official",
      states: toRecord(sStates),
      counties: toRecord(sCounties),
      notes,
    },
  })

  const fl = pStates.get("FL")
  const ca = pStates.get("CA")
  console.log("president states", pStates.size, "counties", pCounties.size, "asOf", asOf)
  console.log("FL", fl && finalize(fl).leader, fl && finalize(fl).total)
  console.log("CA", ca && finalize(ca).leader, ca && finalize(ca).total)
  console.log("senate states", sStates.size, "counties", sCounties.size)
}

main().catch((error: unknown) => {
  console.error(error)
  console.error("Refusing to mix in sample rows. Re-run with --sample to replace the file with fake layout data.")
  process.exit(1)
})
