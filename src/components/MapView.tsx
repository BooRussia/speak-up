import { useEffect, useMemo, useRef, useState } from "react"
import { useSyncExternalStore } from "react"
import { geoAlbersUsa, geoPath, type GeoPermissibleObjects } from "d3-geo"
import { select } from "d3-selection"
import { zoom, zoomIdentity } from "d3-zoom"
import "d3-transition"
import { feature } from "topojson-client"
import type { FeatureCollection } from "geojson"
import statesTopo from "../data/geo/states-10m.json"
import countiesTopo from "../data/geo/counties-10m.json"
import resultsFile from "../data/generated/results.json"
import { byAbbr, byFips } from "../data/states.ts"
import { bandLabel, partyWord, pct, points, votes } from "../lib/format.ts"
import { go, mapHash } from "../lib/route.ts"
import { colorblind, setColorblind, subscribe } from "../lib/storage.ts"

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
type Results = {
  sample: boolean
  sampleBanner?: string
  presidential: {
    source: string
    asOf: string
    states: Record<string, Unit>
    counties: Record<string, Unit>
    unmapped: Record<string, number>
  }
  senate: {
    source: string
    asOf: string
    states: Record<string, Unit>
    counties: Record<string, Unit>
    notes: Record<string, string>
  }
}

const RESULTS = resultsFile as Results
const LAND = "#0B0B10"
const STEPS = ["#121A28", "#1F3758", "#2C5488", "#3972B7", "#468FE7"]
const PARTY: Record<Side, string> = { D: "#5B7FBF", R: "#BF5B5B", O: "#8A8A93", T: "#8A8A93" }

const statesRaw = statesTopo as unknown as { objects: { states: Parameters<typeof feature>[1] } }
const countiesRaw = countiesTopo as unknown as { objects: { counties: Parameters<typeof feature>[1] } }
const stateCollection = feature(statesRaw as never, statesRaw.objects.states) as unknown as FeatureCollection
const countyCollection = feature(countiesRaw as never, countiesRaw.objects.counties) as unknown as FeatureCollection

const stateFeatures = stateCollection.features.filter((item) => byFips(String(item.id ?? "")))
const countyFeatures = countyCollection.features

type Mode = "votes" | "president" | "senate" | "governor" | "house"
const MODES: { id: Mode; label: string }[] = [
  { id: "votes", label: "Votes cast" },
  { id: "president", label: "President 2024" },
  { id: "senate", label: "Senate" },
  { id: "governor", label: "Governor" },
  { id: "house", label: "House" },
]

function usePatterns() {
  return useSyncExternalStore(subscribe, colorblind, () => false)
}

function quintiles(values: number[]) {
  const sorted = values.filter((value) => value > 0).sort((a, b) => a - b)
  const pick = (portion: number) =>
    sorted.length ? (sorted[Math.min(sorted.length - 1, Math.floor(portion * (sorted.length - 1)))] ?? 0) : 0
  const edges = [0.2, 0.4, 0.6, 0.8].map(pick)
  const stepOf = (value: number) => {
    if (value <= 0 || !sorted.length) return -1
    if (value <= edges[0]) return 0
    if (value <= edges[1]) return 1
    if (value <= edges[2]) return 2
    if (value <= edges[3]) return 3
    return 4
  }
  return { edges, stepOf }
}

export default function MapView({ stateCode, countyName }: { stateCode: string | null; countyName: string | null }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const gRef = useRef<SVGGElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [mode, setMode] = useState<Mode>("votes")
  const [table, setTable] = useState(false)
  const [open, setOpen] = useState(Boolean(countyName))
  const [trackedCounty, setTrackedCounty] = useState(countyName)
  if (countyName !== trackedCounty) {
    setTrackedCounty(countyName)
    if (countyName) setOpen(true)
  }
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 }>({ key: "name", dir: 1 })
  const patterns = usePatterns()
  const stateInfo = stateCode ? byAbbr(stateCode) : null

  useEffect(() => {
    const node = wrapRef.current
    if (!node) return
    const measure = () => {
      const rect = node.getBoundingClientRect()
      setSize({ w: Math.max(0, Math.round(rect.width)), h: Math.max(0, Math.round(rect.height)) })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const projection = useMemo(() => {
    if (size.w < 20 || size.h < 20) return null
    const proj = geoAlbersUsa()
    proj.fitExtent(
      [
        [4, 36],
        [size.w - 4, size.h - 96],
      ],
      { type: "FeatureCollection", features: stateFeatures } as FeatureCollection,
    )
    return proj
  }, [size])

  const path = useMemo(() => (projection ? geoPath(projection) : null), [projection])
  const stateLabels = useMemo(() => {
    if (!path || stateInfo) return [] as { abbr: string; x: number; y: number }[]
    const candidates = stateFeatures.flatMap((item) => {
      const info = byFips(String(item.id))
      if (!info) return []
      const bounds = path.bounds(item as GeoPermissibleObjects)
      const width = bounds[1][0] - bounds[0][0]
      const height = bounds[1][1] - bounds[0][1]
      const [x, y] = path.centroid(item as GeoPermissibleObjects)
      if (!Number.isFinite(x) || !Number.isFinite(y)) return []
      return [{ abbr: info.abbr, x, y, width, height, area: width * height }]
    })
    candidates.sort((a, b) => b.area - a.area)
    const placed: { left: number; top: number; right: number; bottom: number }[] = []
    const shown: { abbr: string; x: number; y: number }[] = []
    for (const item of candidates) {
      if (item.width < 32 || item.height < 18) continue
      const box = { left: item.x - 14, top: item.y - 8, right: item.x + 14, bottom: item.y + 8 }
      const hits = placed.some(
        (other) => box.left < other.right && box.right > other.left && box.top < other.bottom && box.bottom > other.top,
      )
      if (hits) continue
      placed.push(box)
      shown.push(item)
    }
    return shown
  }, [path, stateInfo])
  const active = stateFeatures.find((item) => String(item.id) === stateInfo?.fips)

  useEffect(() => {
    const svg = svgRef.current
    const g = gRef.current
    if (!svg || !g || !path) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const behavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 12])
      .filter((event) => event.type !== "dblclick")
      .on("zoom", (event) => {
        g.setAttribute("transform", String(event.transform))
      })
    const selection = select(svg)
    selection.call(behavior)
    let next = zoomIdentity
    if (active) {
      const bounds = path.bounds(active as GeoPermissibleObjects)
      const [[x0, y0], [x1, y1]] = bounds
      const dx = x1 - x0
      const dy = y1 - y0
      if (dx > 1 && dy > 1) {
        const viewH = Math.max(120, size.h - 96 - 36)
        const k = Math.max(1, Math.min(12, 0.9 / Math.max(dx / (size.w - 8), dy / viewH)))
        next = zoomIdentity.translate(size.w / 2 - (k * (x0 + x1)) / 2, 36 + viewH / 2 - (k * (y0 + y1)) / 2).scale(k)
      }
    }
    selection.transition().duration(reduced ? 0 : 400).call(behavior.transform, next)
    return () => {
      selection.on(".zoom", null)
      selection.interrupt()
    }
  }, [path, active, size.w, size.h])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return
      if (document.querySelector("[data-dialog-open]")) return
      if (countyName && stateInfo) go(mapHash(stateInfo.abbr))
      else if (stateInfo) go("#/map")
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [countyName, stateInfo])

  const counties = useMemo(
    () => (stateInfo ? countyFeatures.filter((item) => String(item.id ?? "").startsWith(stateInfo.fips)) : []),
    [stateInfo],
  )
  const selectedCounty = counties.find((item) => item.properties?.name?.toLowerCase() === countyName?.toLowerCase())

  const pres = RESULTS.presidential
  const senate = RESULTS.senate
  const visibleTotals = useMemo(() => {
    if (stateInfo) {
      return counties
        .map((item) => pres.counties[String(item.id)]?.total ?? 0)
        .filter((value) => value > 0)
    }
    return stateFeatures.map((item) => pres.states[byFips(String(item.id))?.abbr ?? ""]?.total ?? 0)
  }, [stateInfo, counties, pres])
  const bands = useMemo(() => quintiles(visibleTotals), [visibleTotals])
  const stepOf = bands.stepOf

  function unitFor(abbr: string, fips?: string): Unit | null {
    if (mode === "president" || mode === "votes") {
      return (fips ? pres.counties[fips] : pres.states[abbr]) ?? null
    }
    if (mode === "senate") return (fips ? senate.counties[fips] : senate.states[abbr]) ?? null
    return null
  }

  function paint(abbr: string, fips?: string) {
    if (mode === "governor" || mode === "house") return LAND
    const unit = unitFor(abbr, fips)
    if (!unit) return LAND
    if (mode === "votes") {
      const step = stepOf(unit.total)
      if (step < 0) return LAND
      return patterns ? `url(#step-${step})` : STEPS[step]
    }
    return patterns ? `url(#side-${unit.winner})` : PARTY[unit.winner]
  }

  const focusAbbr = stateInfo?.abbr
  const focusFips = selectedCounty ? String(selectedCounty.id) : undefined
  const focusUnit = focusAbbr ? unitFor(focusAbbr, focusFips) : null
  const suggestions = query.trim()
    ? counties
        .filter((item) => item.properties?.name?.toLowerCase().includes(query.trim().toLowerCase()))
        .slice(0, 6)
    : []

  const rows = (stateInfo ? counties : stateFeatures).map((item) => {
    const fips = String(item.id)
    const info = stateInfo ?? byFips(fips)
    const abbr = info?.abbr ?? ""
    const unit = stateInfo ? unitFor(abbr, fips) : unitFor(abbr)
    return {
      name: stateInfo ? item.properties?.name ?? fips : info?.name ?? fips,
      abbr,
      fips: stateInfo ? fips : undefined,
      total: unit?.total ?? 0,
      leader: unit ? partyWord(mode === "votes" ? "O" : unit.winner === "T" ? "T" : unit.leader) : "No data",
      share: unit?.share ?? 0,
      margin: unit?.margin ?? 0,
      step: unit ? stepOf(unit.total) : -1,
    }
  })
  const sorted = [...rows].sort((a, b) => {
    const key = sort.key as "name" | "total" | "share" | "margin"
    const left = a[key]
    const right = b[key]
    if (typeof left === "string" && typeof right === "string") return left.localeCompare(right) * sort.dir
    return ((left as number) - (right as number)) * sort.dir
  })

  const missingOffice = mode === "governor" || mode === "house"

  return (
    <div className="map-page">
      <div className="seg" role="group" aria-label="Map data">
        {MODES.map((item) => (
          <button key={item.id} type="button" aria-pressed={mode === item.id} onClick={() => setMode(item.id)}>
            {item.label}
          </button>
        ))}
      </div>
      {RESULTS.sample && <p className="banner">{RESULTS.sampleBanner ?? "Sample data for layout, not real results"}</p>}
      {missingOffice && <p className="banner">No county file is bundled for this office. The map is not filled with guessed results.</p>}
      {stateCode && !stateInfo && <p className="banner">That state is not on this map.</p>}
      {table ? (
        <div className="table-wrap">
          <button className="text-btn" type="button" onClick={() => setTable(false)}>
            View as map
          </button>
          <table>
            <caption className="sr">{MODES.find((item) => item.id === mode)?.label} results</caption>
            <thead>
              <tr>
                {["name", "leader", "share", "margin", "total"].map((key) => (
                  <th key={key} aria-sort={sort.key === key ? (sort.dir > 0 ? "ascending" : "descending") : "none"}>
                    <button
                      type="button"
                      onClick={() => setSort({ key, dir: sort.key === key && sort.dir === 1 ? -1 : 1 })}
                    >
                      {key === "name" ? "Place" : key === "total" ? "Votes" : key[0].toUpperCase() + key.slice(1)}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => (
                <tr key={row.name}>
                  <td>
                    <button
                      className="text-btn"
                      type="button"
                      onClick={() => go(mapHash(row.abbr, stateInfo ? row.name : null))}
                    >
                      {row.name}
                    </button>
                  </td>
                  <td className="nums">{mode === "votes" ? (row.step >= 0 ? bandLabel(row.step, bands.edges) : "No data") : row.leader}</td>
                  <td className="nums">{row.total ? pct(row.share) : "—"}</td>
                  <td className="nums">{row.total ? points(row.margin) : "—"}</td>
                  <td className="nums">{row.total ? votes(row.total) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="note">{sourceLine(mode)}</p>
        </div>
      ) : (
        <div className="map-wrap" ref={wrapRef}>
          {size.w > 0 && path && (
            <svg ref={svgRef} role="img" aria-label="United States map. Use the table for the same numbers.">
              <defs>
                {STEPS.map((color, index) => (
                  <pattern key={color} id={`step-${index}`} width="8" height="8" patternUnits="userSpaceOnUse">
                    <rect width="8" height="8" fill={color} />
                    {Array.from({ length: index + 1 }, (_, dot) => (
                      <circle key={dot} cx={(dot * 3) % 8} cy={dot % 2 === 0 ? 2 : 6} r="0.8" fill="#F0F0FA" />
                    ))}
                  </pattern>
                ))}
                <pattern id="side-D" width="8" height="8" patternUnits="userSpaceOnUse">
                  <rect width="8" height="8" fill={PARTY.D} />
                  <circle cx="2" cy="2" r="1.1" fill="#0B0B10" />
                  <circle cx="6" cy="6" r="1.1" fill="#0B0B10" />
                </pattern>
                <pattern id="side-R" width="8" height="8" patternUnits="userSpaceOnUse">
                  <rect width="8" height="8" fill={PARTY.R} />
                  <path d="M0 8 L8 0" stroke="#0B0B10" strokeWidth="1.4" />
                </pattern>
                <pattern id="side-O" width="8" height="8" patternUnits="userSpaceOnUse">
                  <rect width="8" height="8" fill={PARTY.O} />
                  <path d="M0 4 H8" stroke="#0B0B10" strokeWidth="1.2" />
                </pattern>
                <pattern id="side-T" width="8" height="8" patternUnits="userSpaceOnUse" href="#side-O" />
              </defs>
              <g ref={gRef}>
                {stateFeatures.map((item) => {
                  const info = byFips(String(item.id))
                  if (!info) return null
                  const d = path(item as GeoPermissibleObjects)
                  if (!d) return null
                  return (
                    <path
                      key={info.abbr}
                      d={d}
                      fill={paint(info.abbr)}
                      stroke="rgba(240,240,250,0.25)"
                      strokeWidth={1}
                      vectorEffect="non-scaling-stroke"
                      onClick={() => {
                        setOpen(true)
                        go(mapHash(info.abbr))
                      }}
                    />
                  )
                })}
                {stateInfo &&
                  [...counties]
                    .sort((a, b) => Number(a.properties?.name?.toLowerCase() === countyName?.toLowerCase()) - Number(b.properties?.name?.toLowerCase() === countyName?.toLowerCase()))
                    .map((item) => {
                    const d = path(item as GeoPermissibleObjects)
                    if (!d) return null
                    const name = item.properties?.name ?? ""
                    const selected = name.toLowerCase() === countyName?.toLowerCase()
                    return (
                      <path
                        key={String(item.id)}
                        d={d}
                        fill={paint(stateInfo.abbr, String(item.id))}
                        stroke={selected ? "#F0F0FA" : "rgba(240,240,250,0.12)"}
                        strokeWidth={selected ? 2 : 0.5}
                        vectorEffect="non-scaling-stroke"
                        onClick={() => {
                          setOpen(true)
                          go(mapHash(stateInfo.abbr, name))
                        }}
                      />
                    )
                  })}
                {!stateInfo &&
                  stateLabels.map((item) => (
                    <text key={item.abbr} x={item.x} y={item.y} textAnchor="middle" fill="#b7b7c2" fontSize="11" pointerEvents="none">
                      {item.abbr}
                    </text>
                  ))}
              </g>
            </svg>
          )}
          <div className="map-overlay">
            <div className="crumb">
              {stateInfo ? (
                <button type="button" onClick={() => go("#/map")}>
                  &lt; US
                </button>
              ) : (
                <span>US</span>
              )}
              {stateInfo && (
                <>
                  <span>›</span>
                  {countyName ? (
                    <button type="button" onClick={() => go(mapHash(stateInfo.abbr))}>
                      {stateInfo.name}
                    </button>
                  ) : (
                    <span>{stateInfo.name}</span>
                  )}
                </>
              )}
              {selectedCounty && (
                <>
                  <span>›</span>
                  <span>{selectedCounty.properties?.name}</span>
                </>
              )}
            </div>
            {stateInfo && (
              <div className="county-search">
                <label className="sr" htmlFor="county">
                  County name
                </label>
                <input
                  id="county"
                  value={query}
                  placeholder="County name"
                  role="combobox"
                  aria-expanded={suggestions.length > 0}
                  aria-controls="county-list"
                  onChange={(event) => setQuery(event.target.value)}
                />
                {suggestions.length > 0 && (
                  <div className="suggest" id="county-list" role="listbox">
                    {suggestions.map((item) => (
                      <button
                        key={String(item.id)}
                        type="button"
                        role="option"
                        onClick={() => {
                          setQuery("")
                          setOpen(true)
                          go(mapHash(stateInfo.abbr, item.properties?.name ?? ""))
                        }}
                      >
                        {item.properties?.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <section className="peek" aria-live="polite">
            <button className="handle" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
              <span className="grab" />
              <span className="sr">{open ? "Hide details" : "Show details"}</span>
            </button>
            <div className="sheet-actions">
              <button type="button" onClick={() => setTable(true)}>
                View as table
              </button>
              <button type="button" aria-pressed={patterns} onClick={() => setColorblind(!patterns)}>
                Colorblind patterns
              </button>
            </div>
            <Legend mode={mode} patterns={patterns} edges={bands.edges} />
            {open && (
              <Peek
                title={selectedCounty?.properties?.name ?? stateInfo?.name ?? "United States"}
                mode={mode}
                unit={focusUnit}
                step={focusUnit ? stepOf(focusUnit.total) : -1}
                edges={bands.edges}
                note={[
                  stateInfo ? senate.notes[stateInfo.abbr] : "",
                  focusUnit?.unofficial ? "MEDSL marks this return unofficial." : "",
                  stateInfo && pres.unmapped[stateInfo.abbr]
                    ? `${pres.unmapped[stateInfo.abbr]} reporting units in ${stateInfo.name} have no county FIPS, so they are in the state total only.`
                    : "",
                  countyName && stateInfo && !selectedCounty ? "That county is not in this state." : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              />
            )}
          </section>
        </div>
      )}
    </div>
  )
}

function sourceLine(mode: Mode) {
  if (mode === "senate") return `${RESULTS.senate.source}. As of ${RESULTS.senate.asOf}.`
  if (mode === "governor" || mode === "house") return "No county file is bundled for this office."
  if (mode === "votes") {
    return `${RESULTS.presidential.source}. Version ${RESULTS.presidential.asOf}. This is the number of presidential votes, not turnout.`
  }
  return `${RESULTS.presidential.source}. Version ${RESULTS.presidential.asOf}.`
}

function Legend({ mode, patterns, edges }: { mode: Mode; patterns: boolean; edges: number[] }) {
  if (mode === "governor" || mode === "house") {
    return (
      <p className="muted">
        Land with no fill. Party colors stay off until a contest with bundled results is selected.
      </p>
    )
  }
  if (mode === "votes") {
    return (
      <div className="legend">
        {STEPS.map((color, index) => (
          <span key={color}>
            <i className="swatch" style={{ background: patterns ? undefined : color, backgroundImage: patterns ? `url(#step-${index})` : undefined, backgroundColor: color }} />
            {bandLabel(index, edges)}
          </span>
        ))}
      </div>
    )
  }
  return (
    <div className="legend">
      {(["D", "R", "T"] as Side[]).map((side) => (
        <span key={side}>
          <i className="swatch" style={{ background: PARTY[side] }} />
          {partyWord(side)}
          {side === "T" ? " under 0.5 pts" : ""}
        </span>
      ))}
      <span>
        <i className="swatch" style={{ background: LAND, border: "1px solid rgba(240,240,250,0.25)" }} />
        No election in this file
      </span>
    </div>
  )
}

function Peek({
  title,
  mode,
  unit,
  step,
  edges,
  note,
}: {
  title: string
  mode: Mode
  unit: Unit | null
  step: number
  edges: number[]
  note: string
}) {
  return (
    <div>
      <h2>{title}</h2>
      {mode === "governor" || mode === "house" ? (
        <p>County winners for this office are not in the bundled file.</p>
      ) : !unit ? (
        <p>{mode === "senate" ? "No Senate election in the bundled 2024 county file." : "Tap a state, then a county."}</p>
      ) : mode === "votes" ? (
        <p className="nums">
          {votes(unit.total)} presidential votes{step >= 0 ? `. ${bandLabel(step, edges)} in this view` : ""}.
        </p>
      ) : (
        <>
          <p>
            {unit.winner === "T" ? "Toss-up" : partyWord(unit.leader)} · share {pct(unit.share)} · margin {points(unit.margin)}
          </p>
          <p className="nums">
            Democrat {votes(unit.d)} · Republican {votes(unit.r)} · Other {votes(unit.o)} · Total {votes(unit.total)}
          </p>
        </>
      )}
      {note && <p className="muted">{note}</p>}
      <p className="muted">Source: {sourceLine(mode)}</p>
    </div>
  )
}
