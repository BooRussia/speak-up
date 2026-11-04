import { useState } from "react"
import { useSyncExternalStore } from "react"
import { BRANCHES, CONGRESS, COURT, NOW_NOTE, PROJECTED } from "../data/government.ts"
import { partyWord } from "../lib/format.ts"
import { hemicycle, seatOrder, type Counts, type Seat } from "../lib/hemicycle.ts"
import { colorblind, subscribe } from "../lib/storage.ts"
import { FinePrint } from "./Chrome.tsx"

function usePatterns() {
  return useSyncExternalStore(subscribe, colorblind, () => false)
}

const FILL: Record<Seat, string> = {
  D: "#5B7FBF",
  R: "#BF5B5B",
  I: "#9A84D6",
  U: "#8A8A93",
  V: "transparent",
}

export function LearnView() {
  const [open, setOpen] = useState<string | null>(null)
  const [when, setWhen] = useState<"now" | "next">("now")
  const patterns = usePatterns()
  const senate = when === "now" ? CONGRESS.senate : PROJECTED.senate
  const house = when === "now" ? CONGRESS.house : PROJECTED.house

  return (
    <div className="column">
      <h1 className="hero">How government works</h1>
      {CONGRESS.sample && <p>Sample roster for layout, not the real Congress.</p>}
      <ul className="tree">
        {BRANCHES.map((node) => (
          <li key={node.id} className="tree-node">
            {node.kicker && <h2 className="kicker">{node.kicker}</h2>}
            <button type="button" aria-expanded={open === node.id} onClick={() => setOpen(open === node.id ? null : node.id)}>
              {node.party && (
                <span
                  className="mark"
                  style={{ background: node.party === "R" ? FILL.R : FILL.D }}
                  aria-hidden="true"
                />
              )}
              <span>
                <span className="node-title">{node.title}</span>
                <span className="node-meta"> · {node.meta}</span>
                {node.party && <span className="node-meta"> · {partyWord(node.party)}</span>}
              </span>
            </button>
            {open === node.id && (
              <div className="explainer">
                {node.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {node.id === "supreme" && <CourtDots patterns={patterns} />}
                {node.id === "senate" && <Split counts={CONGRESS.senate} />}
                {node.id === "house" && <Split counts={CONGRESS.house} />}
              </div>
            )}
          </li>
        ))}
      </ul>

      <h2 className="kicker">Chambers</h2>
      <div className="seg" role="group" aria-label="Congress to show">
        <button type="button" aria-pressed={when === "now"} onClick={() => setWhen("now")}>
          Now (119th Congress)
        </button>
        <button type="button" aria-pressed={when === "next"} onClick={() => setWhen("next")}>
          Starting Jan 3, 2027 (120th Congress)
        </button>
      </div>
      {when === "next" && (
        <>
          <p className="badge-line">
            <span className="badge uncalled">{PROJECTED.asOf}</span>
          </p>
          <p>{PROJECTED.detail}</p>
          <p className="race-src">
            Sources:{" "}
            {PROJECTED.sources.map((src, index) => (
              <span key={src.href}>
                {index > 0 && " · "}
                <a className="src" href={src.href} target="_blank" rel="noreferrer">
                  {src.label}
                </a>
              </span>
            ))}
          </p>
        </>
      )}
      {when === "now" && <p className="note">{NOW_NOTE}</p>}
      <Chamber title="Senate" counts={senate} threshold={51} patterns={patterns} />
      <Chamber title="House" counts={house} threshold={218} patterns={patterns} />
      {when === "now" && CONGRESS.independents.length > 0 && (
        <p className="note">
          {CONGRESS.independents
            .map((person) => {
              const seat = person.district === null ? person.state : `${person.state}-${person.district || "AL"}`
              const caucus = person.caucus ? `caucuses with ${person.caucus}s` : "no caucus listed"
              return `${person.name} (${seat}) is listed as Independent and ${caucus}`
            })
            .join(". ")}
          .
        </p>
      )}

      <a className="results-link" href="#/results">
        <span>
          <span className="node-title">2026 results</span>
          <span className="node-meta"> · Senate, governors, House, Florida</span>
        </span>
        <span aria-hidden="true">›</span>
      </a>

      <h2 className="kicker">Divided government</h2>
      <p>
        Divided government means the President is from one party and the other party holds the House, the Senate, or both.
      </p>
      <p>Bills the President opposes can be vetoed. Congress can override a veto only with a two-thirds vote in each chamber. That bar is rarely met.</p>
      <p>Bills that the majority in Congress opposes do not pass.</p>
      <p>The Senate must confirm federal judges and Cabinet picks. When the Senate and the President disagree, nominations can wait.</p>
      <p>Budget fights are more common. If they do not agree on funding, parts of the government can shut down.</p>
      <p className="note">On the projected 2027 counts, the President is Republican and Democrats are projected to control both chambers. That would be divided government. Results are unofficial and still coming in.</p>
      <ol className="flow">
        <li>
          <i />
          1. Bill passes the House
        </li>
        <li>
          <i />
          2. Bill passes the Senate
        </li>
        <li>
          <i />
          3. President vetoes
        </li>
        <li>
          <i />
          4. Override needs 2/3
        </li>
      </ol>
      <p className="link-row">
        <a href="https://www.supremecourt.gov/">Supreme Court official site</a>
      </p>
      <FinePrint />
    </div>
  )
}

function Split({ counts }: { counts: Counts }) {
  const parts = [
    { n: counts.democrat, color: FILL.D, label: "Democrat" },
    { n: counts.independent, color: FILL.I, label: "Independent" },
    { n: counts.unlisted, color: "transparent", label: "Not listed" },
    { n: counts.republican, color: FILL.R, label: "Republican" },
  ]
  return (
    <div>
      <div className="bar" aria-hidden="true">
        {parts.map((part) => (
          <i key={part.label} style={{ width: `${(part.n / counts.total) * 100}%`, background: part.color, border: part.n ? "0" : undefined }} />
        ))}
      </div>
      <p className="counts">
        {counts.democrat} Democrats · {counts.republican} Republicans · {counts.independent} Independents · {counts.unlisted} not listed
      </p>
    </div>
  )
}

function CourtDots({ patterns }: { patterns: boolean }) {
  const seats: Seat[] = [
    ...Array.from({ length: COURT.republicanAppointed }, () => "R" as const),
    ...Array.from({ length: COURT.democraticAppointed }, () => "D" as const),
  ]
  return (
    <div>
      <p>6 Republican-appointed · 3 Democratic-appointed. This is who appointed them.</p>
      <svg viewBox="0 0 180 24" role="img" aria-label="6 Republican-appointed and 3 Democratic-appointed justices">
        {seats.map((seat, index) => (
          <Dot key={index} seat={seat} x={12 + index * 18} y={12} r={6} patterns={patterns} />
        ))}
      </svg>
      <p className="note">{COURT.note}</p>
    </div>
  )
}

function Chamber({
  title,
  counts,
  threshold,
  patterns,
}: {
  title: string
  counts: Counts
  threshold: number
  patterns: boolean
}) {
  const seats = seatOrder(counts)
  const dots = hemicycle(seats.length)
  const radius = seats.length > 150 ? 3 : 5.5
  const marker = dots[threshold - 1]
  const minX = Math.min(...dots.map((dot) => dot.x)) - 24
  const maxX = Math.max(...dots.map((dot) => dot.x)) + 24
  const minY = Math.min(...dots.map((dot) => dot.y)) - 28
  const maxY = 18
  return (
    <section>
      <h3 className="node-title" style={{ marginTop: 16 }}>
        {title}
      </h3>
      <p className="counts">
        {counts.uncalled !== undefined
          ? `${counts.democrat + counts.independent} Democratic${counts.independent ? ` (incl. ${counts.independent} independents)` : ""} · ${counts.republican} Republicans · ${counts.uncalled} uncalled.`
          : `${counts.democrat} Democrats · ${counts.republican} Republicans · ${counts.independent} Independents · ${counts.unlisted} not listed.`}{" "}
        Majority threshold {threshold}.
      </p>
      <div className="chart-wrap">
        <svg viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`} role="img" aria-label={`${title} seats by party`}>
          <line x1="0" y1="0" x2="0" y2={minY + 12} stroke="currentColor" strokeOpacity="0.35" />
          {marker && (
            <line x1="0" y1="0" x2={marker.x * 1.08} y2={marker.y * 1.08} stroke="currentColor" strokeDasharray="3 3" strokeOpacity="0.7" />
          )}
          {marker && (
            <text x={marker.x * 1.12} y={marker.y * 1.12} fill="currentColor" fontSize="13">
              {threshold}
            </text>
          )}
          {dots.map((dot, index) => (
            <Dot key={index} seat={seats[index]} x={dot.x} y={dot.y} r={radius} patterns={patterns} />
          ))}
        </svg>
      </div>
      <div className="legend">
        <LegendItem seat="D" label="Democrat" patterns={patterns} />
        <LegendItem seat="R" label="Republican" patterns={patterns} />
        <LegendItem seat="I" label="Independent" patterns={patterns} />
        {counts.uncalled !== undefined ? (
          <LegendItem seat="U" label="Uncalled" patterns={patterns} />
        ) : (
          <LegendItem seat="V" label="Not listed" patterns={patterns} />
        )}
      </div>
    </section>
  )
}

function LegendItem({ seat, label, patterns }: { seat: Seat; label: string; patterns: boolean }) {
  return (
    <span>
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
        <Dot seat={seat} x={7} y={7} r={5} patterns={patterns} />
      </svg>
      {label}
    </span>
  )
}

function Dot({ seat, x, y, r, patterns }: { seat: Seat; x: number; y: number; r: number; patterns: boolean }) {
  const fill = FILL[seat]
  const stroke = seat === "V" ? "currentColor" : "none"
  if (!patterns || seat === "D") {
    return <circle cx={x} cy={y} r={r} fill={fill} stroke={stroke} strokeWidth={seat === "V" ? 1 : 0} />
  }
  if (seat === "R") {
    return <rect x={x - r} y={y - r} width={r * 2} height={r * 2} fill={fill} />
  }
  if (seat === "U") {
    return <circle cx={x} cy={y} r={r * 0.8} fill={fill} />
  }
  if (seat === "I") {
    return <polygon points={`${x},${y - r} ${x + r},${y} ${x},${y + r} ${x - r},${y}`} fill={fill} />
  }
  return <circle cx={x} cy={y} r={r} fill="none" stroke="currentColor" strokeWidth="1" />
}
