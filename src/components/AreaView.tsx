import { useState } from "react"
import { useSyncExternalStore } from "react"
import { CONGRESS } from "../data/government.ts"
import { byAbbr } from "../data/states.ts"
import { formatPhone, initials, telHref } from "../lib/format.ts"
import { stateFromLonLat } from "../lib/geo.ts"
import { parsePlace } from "../lib/place.ts"
import { place, scopeState, setPlace, subscribe } from "../lib/storage.ts"
import { FinePrint } from "./Chrome.tsx"
import { IconMail, IconPhone } from "./Icons.tsx"

function usePlace() {
  return useSyncExternalStore(subscribe, place, () => null)
}

export function AreaView() {
  const typed = usePlace()
  const scope = useSyncExternalStore(subscribe, scopeState, () => null)
  const saved =
    typed && (!scope || typed.state === scope)
      ? typed
      : scope
        ? { query: "", city: null, state: scope, zip: null, source: "typed" as const }
        : typed
  const [query, setQuery] = useState(saved?.query ?? "")
  const [message, setMessage] = useState("")
  const [locating, setLocating] = useState(false)
  const [district, setDistrict] = useState<string>("")

  const state = saved ? byAbbr(saved.state) : null
  const roster = saved ? CONGRESS.byState[saved.state] : null
  const reps = roster?.representatives ?? []
  const chosen = reps.find((rep) => String(rep.district ?? 0) === district) ?? (reps.length === 1 ? reps[0] : null)

  async function locate() {
    setMessage("")
    if (!navigator.geolocation) {
      setMessage("Location is not available in this browser.")
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const found = await stateFromLonLat(position.coords.longitude, position.coords.latitude)
        setLocating(false)
        if (!found) {
          setMessage("That location is outside the states on this map.")
          return
        }
        setPlace({ query: found.name, city: null, state: found.abbr, zip: null, source: "location" })
        setQuery(found.name)
        setDistrict("")
      },
      () => {
        setLocating(false)
        setMessage("Location is off. Enter a city or ZIP.")
      },
      { enableHighAccuracy: false, timeout: 8000 },
    )
  }

  function submit(value: string) {
    const parsed = parsePlace(value)
    if (!parsed.ok) {
      setMessage(parsed.message)
      return
    }
    setMessage("")
    setDistrict("")
    setPlace({
      query: value.trim(),
      city: parsed.city,
      state: parsed.state,
      zip: parsed.zip,
      source: "typed",
    })
  }

  const placeLabel = saved
    ? [saved.city, byAbbr(saved.state)?.name].filter(Boolean).join(", ") +
      (saved.zip ? ` ${saved.zip}` : "") +
      (saved.source === "location" ? " · from your location" : "")
    : ""

  return (
    <div className="column">
      <h1 className="hero">Your area</h1>
      <form
        className="row-form"
        onSubmit={(event) => {
          event.preventDefault()
          submit(query)
        }}
      >
        <label className="sr" htmlFor="place">
          City or ZIP
        </label>
        <input
          id="place"
          className="field"
          value={query}
          placeholder="City or ZIP"
          enterKeyHint="search"
          autoComplete="postal-code"
          onChange={(event) => setQuery(event.target.value)}
        />
        <button className="text-btn" type="button" onClick={locate}>
          Use my location
        </button>
      </form>
      {message && <p>{message}</p>}
      {locating && (
        <div aria-hidden="true">
          <div className="skeleton" />
          <div className="skeleton w2" />
          <div className="skeleton w3" />
        </div>
      )}
      {!saved && !locating && (
        <div className="empty">
          <p className="empty-title">Find who represents you</p>
          <p className="note">Type a city and state (like “Ocala FL”) or a ZIP code, then press Enter. Your place stays in this browser.</p>
        </div>
      )}
      {saved && state && (
        <>
          <p className="note">{placeLabel}. A ZIP prefix gives the state, not your House district.</p>
          <h2 className="kicker">Voting</h2>
          <div className="group">
            <OfficialRow
              name={state.electionName}
              office={`${state.name} election office`}
              mark={state.abbr}
              href={state.electionUrl}
            />
          </div>
          <p className="note">Source: state election office. Last updated Nov 4, 2026.</p>

          <h2 className="kicker">Federal</h2>
          <div className="group">
            {roster?.senators.map((person) => (
              <OfficialRow
                key={person.name}
                name={person.name}
                office={`U.S. Senator · ${state.name}`}
                phone={person.phone}
                href={person.contact}
              />
            ))}
            {CONGRESS.unlistedSenate.includes(state.abbr) && (
              <p className="note one-line">
                Second {state.abbr} seat updating.{" "}
                <a className="inline-link" href="https://www.senate.gov/senators/senators-contact.htm">Check senate.gov</a>
              </p>
            )}
            {reps.length > 1 && (
              <label className="district">
                <span className="name">Your U.S. House district</span>
                <span className="office">Optional. Pick yours to see your representative. Not sure? Use “Find your representative” below.</span>
                <select value={district} onChange={(event) => setDistrict(event.target.value)} aria-label="House district">
                  <option value="">Choose a district</option>
                  {reps.map((rep) => (
                    <option key={rep.district} value={String(rep.district ?? 0)}>
                      {rep.district === 0 ? "At large" : `District ${rep.district}`}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {chosen && (
              <OfficialRow
                name={chosen.name}
                office={chosen.district === 0 ? "U.S. Representative · at large" : `U.S. Representative · District ${chosen.district}`}
                phone={chosen.phone}
                href={chosen.contact}
              />
            )}
            <p className="link-row">
              <a href="https://www.house.gov/representatives/find-your-representative">Find your representative</a>
            </p>
            <p className="note">House districts follow the full address.</p>
            {roster?.delegate && (
              <OfficialRow
                name={roster.delegate.name}
                office="Delegate · non-voting"
                phone={roster.delegate.phone}
                href={roster.delegate.contact}
              />
            )}
          </div>
          <p className="note">
            Source: {CONGRESS.sample ? "Sample roster, not real officeholders." : "unitedstates/congress-legislators."} Last
            updated Nov 4, 2026.
          </p>

          <h2 className="kicker">State</h2>
          <div className="group">
            {state.governor && (
              <OfficialRow
                name={state.governor.name}
                office={`Governor · ${state.name}`}
                phone={state.governor.phone}
                href={state.governor.url}
              />
            )}
            {state.mayor && (
              <OfficialRow
                name={state.mayor.name}
                office="Mayor · District of Columbia"
                phone={state.mayor.phone}
                href={state.mayor.url}
              />
            )}
            <OfficialRow
              name="State legislators"
              office="Roster not bundled"
              mark={state.abbr}
              href={state.legislatureUrl}
            />
          </div>
          <p className="note">
            Source: National Governors Association officeholder list, reviewed Nov 4, 2026. Phone is the office main line.
            Confirm it on the official page.
          </p>

          <h2 className="kicker">Local</h2>
          <div className="group">
            <OfficialRow
              name="Local officials and judges"
              office="Use the state sample-ballot lookup"
              mark={state.abbr}
              href={state.ballotUrl}
            />
          </div>
          <p className="note">City councils and local courts are not bundled. The state voter lookup is the official start.</p>
        </>
      )}
      <FinePrint />
    </div>
  )
}

function OfficialRow({
  name,
  office,
  phone,
  href,
  mark,
}: {
  name: string
  office: string
  phone?: string | null
  href?: string | null
  mark?: string
}) {
  return (
    <div className="person">
      <div className="avatar" aria-hidden="true">
        {mark ?? initials(name)}
      </div>
      <div className="who">
        <div className="name">{name}</div>
        <div className="office">{office}</div>
      </div>
      <div className="icon-btns">
        {phone && (
          <a href={telHref(phone)} aria-label={`Call ${name} at ${formatPhone(phone)}`}>
            <IconPhone />
          </a>
        )}
        {href && (
          <a href={href} aria-label={`Contact ${name}`}>
            <IconMail />
          </a>
        )}
      </div>
    </div>
  )
}
