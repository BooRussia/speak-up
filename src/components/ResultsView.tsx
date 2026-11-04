import { useEffect } from "react"
import { GOVERNOR_RACES, PROJECTED_LABEL, RESULTS, SENATE_RACES, type Race } from "../data/elections.ts"
import { FinePrint } from "./Chrome.tsx"

const PARTY: Record<string, string> = { D: "Democrat", R: "Republican", I: "Independent", NPA: "No party", LPF: "Libertarian" }

function Badge({ called, label }: { called: boolean | null; label?: string }) {
  return <span className={called ? "badge called" : "badge uncalled"}>{label ?? (called ? "Called" : "Uncalled")}</span>
}

function host(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return "source"
  }
}

function Src({ href, label }: { href: string; label?: string }) {
  return (
    <a className="src" href={href} target="_blank" rel="noreferrer">
      {label ?? host(href)}
    </a>
  )
}

function RaceRow({ race, title }: { race: Race; title: string }) {
  return (
    <li className="race">
      <div className="race-top">
        <span className="race-title">{title}</span>
        <Badge called={race.called} />
      </div>
      {race.winner ? (
        <p className="race-win">
          <span className={`pdot p-${race.party}`} aria-hidden="true" />
          {race.winner} · {PARTY[race.party ?? ""] ?? race.party}
          {race.pct !== null && <span className="pct"> · {race.pct}%</span>}
        </p>
      ) : (
        <p className="race-win muted">No winner yet</p>
      )}
      {race.note && <p className="note">{race.note}</p>}
      <p className="race-src">
        Source: <Src href={race.source} />
        {race.pctSource && race.pctSource !== race.source && (
          <>
            {" "}
            · Vote %: <Src href={race.pctSource} />
          </>
        )}
      </p>
    </li>
  )
}

function Votes({ votes }: { votes: Record<string, number[]> }) {
  return (
    <ul className="votes">
      {Object.entries(votes).map(([name, [n, pct]]) => (
        <li key={name}>
          <span>{name}</span>
          <span className="num">
            {pct}% · {n.toLocaleString()}
          </span>
        </li>
      ))}
    </ul>
  )
}

export function ResultsView({ section }: { section: string | null }) {
  useEffect(() => {
    const el = section ? document.getElementById(section) : null
    if (el) el.scrollIntoView({ block: "start" })
    else window.scrollTo(0, 0)
  }, [section])
  const fl = RESULTS.florida
  const sb = RESULTS.senate.projected_balance_jan_3_2027
  const hc = RESULTS.house.called
  const gs = RESULTS.governors.summary_all_50
  return (
    <div className="column results">
      <h1 className="hero">2026 results</h1>
      <p className="note">
        {PROJECTED_LABEL}. Unofficial; counting continues. Winners take office in January 2027. Until then, current officeholders are
        still serving.
      </p>
      <nav className="jump" aria-label="Sections">
        <a href="#/results/senate">Senate</a>
        <a href="#/results/governors">Governors</a>
        <a href="#/results/house">House</a>
        <a href="#/results/florida">Florida</a>
      </nav>

      <h2 className="kicker" id="senate">Senate</h2>
      <p>
        Projected for Jan 3, 2027: {sb.D_caucus_total} Democratic (including {sb.I_caucusing_D} independents) · {sb.R} Republican ·{" "}
        {sb.uncalled.length} uncalled ({sb.uncalled.join(", ")}).
      </p>
      <p className="race-src">
        Sources: {sb.sources.map((s, i) => (
          <span key={s}>
            {i > 0 && " · "}
            <Src href={s} />
          </span>
        ))}
      </p>
      <ul className="races">
        {SENATE_RACES.map((race) => (
          <RaceRow key={race.state + race.special} race={race} title={`${race.state}${race.special ? " (special)" : ""}`} />
        ))}
      </ul>

      <h2 className="kicker" id="governors">Governors</h2>
      <p>
        All 50 governors after these races: {gs.D} Democratic · {gs.R} Republican · uncalled {gs.uncalled.join(", ")}. {gs.races_called} races
        called. <Src href={gs.source} />
      </p>
      <ul className="races">
        {GOVERNOR_RACES.map((race) => (
          <RaceRow key={race.state} race={race} title={race.state} />
        ))}
      </ul>

      <h2 className="kicker" id="house">House</h2>
      <p>
        AP count: {hc.D} Democratic · {hc.R} Republican · {hc.uncalled_count} uncalled. Democrats are projected to hold the majority.{" "}
        <Src href={hc.source} />
      </p>
      <p className="note">
        Cross-check ({RESULTS.house.cross_check.as_of}): {RESULTS.house.cross_check.D_elected} D, {RESULTS.house.cross_check.R_elected} R
        called by its own rules. <Src href={RESULTS.house.cross_check.source} />
      </p>
      <h3 className="node-title">Close races not yet called</h3>
      <ul className="races">
        {RESULTS.house.uncalled_districts_partial.map((d) => (
          <li className="race" key={d.district}>
            <div className="race-top">
              <span className="race-title">{d.district}</span>
              <Badge called={false} />
            </div>
            <p className="note">{d.leader}</p>
            <p className="race-src">
              Source: <Src href={(d as { source?: string }).source ?? RESULTS.house.cross_check.source} />
            </p>
          </li>
        ))}
      </ul>
      <p className="note">{RESULTS.house.uncalled_note}</p>

      <h2 className="kicker" id="florida">Florida</h2>
      <ul className="races">
        <li className="race">
          <div className="race-top">
            <span className="race-title">Governor</span>
            <Badge called={fl.governor.called} />
          </div>
          <p className="race-win">
            <span className="pdot p-R" aria-hidden="true" />
            {fl.governor.winner} · {PARTY[fl.governor.party]}
          </p>
          <Votes votes={fl.governor.votes} />
          <p className="note">
            Marion County: Donalds {fl.governor.marion_county.Donalds}%, Jolly {fl.governor.marion_county.Jolly}%.
          </p>
          <p className="race-src">
            Votes: <Src href={fl.governor.source} /> · Call: <Src href={fl.governor.call_source} />
          </p>
        </li>
        <li className="race">
          <div className="race-top">
            <span className="race-title">U.S. Senate (special)</span>
            <Badge called={fl.us_senate_special.called} />
          </div>
          <p className="race-win">
            <span className="pdot p-R" aria-hidden="true" />
            {fl.us_senate_special.winner} · {PARTY[fl.us_senate_special.party]}
          </p>
          <Votes votes={fl.us_senate_special.votes} />
          <p className="note">
            Marion County: Moody {fl.us_senate_special.marion_county.Moody}%, Nixon {fl.us_senate_special.marion_county.Nixon}%.
          </p>
          <p className="race-src">
            Votes: <Src href={fl.us_senate_special.source} />
          </p>
        </li>
        {fl.us_house_marion_ocala.map((d) => (
          <li className="race" key={d.district}>
            <div className="race-top">
              <span className="race-title">U.S. House {d.district}</span>
              <Badge called={false} label="Leading, not yet called" />
            </div>
            <p className="race-win">
              <span className="pdot p-R" aria-hidden="true" />
              {d.winner_or_leader} leads
            </p>
            <ul className="votes">
              {Object.entries(d.districtwide_pct).map(([name, pct]) => (
                <li key={name}>
                  <span>{name}</span>
                  <span className="num">{pct}%</span>
                </li>
              ))}
            </ul>
            <p className="note">{d.note}</p>
            <p className="race-src">
              Source: <Src href={d.source} />
            </p>
          </li>
        ))}
      </ul>
      <h3 className="node-title">Amendments and Marion County measures</h3>
      <ul className="races">
        {fl.ballot_measures.map((m) => (
          <li className="race" key={m.name}>
            <div className="race-top">
              <span className="race-title">{m.name}</span>
              <span className={m.result.startsWith("Passed") ? "badge called" : "badge failed"}>{m.result}</span>
            </div>
            <p className="note num">
              Yes {m.yes_pct}%{"no_pct" in m ? ` · No ${(m as { no_pct: number }).no_pct}%` : ""}
              {"marion_yes_pct" in m ? ` · Marion yes ${(m as { marion_yes_pct: number }).marion_yes_pct}%` : ""}
            </p>
            <p className="race-src">
              Source: <Src href={m.source} />
            </p>
          </li>
        ))}
      </ul>
      <p className="note">
        Marion County turnout: {fl.marion_turnout.pct}% ({fl.marion_turnout.ballots.toLocaleString()} ballots).{" "}
        <Src href={fl.marion_turnout.source} />
      </p>
      <FinePrint />
    </div>
  )
}
