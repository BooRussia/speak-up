import { useEffect, useRef, useState } from "react"
import { useSyncExternalStore } from "react"
import { ANSWER_MAP, ANSWERS, CHIP_ORDER, LEARN_CHIP, MORE_IDS, PRIMARY_IDS } from "../data/answers.ts"
import { matchQuestion } from "../lib/match.ts"
import { go } from "../lib/route.ts"
import {
  affiliation,
  markStateTipSeen,
  scopeState,
  setAffiliation,
  setScopeState,
  stateTipSeen,
  subscribe,
  type Affiliation,
} from "../lib/storage.ts"

const TILE_ICON: Record<string, LucideIcon> = {
  "make-a-difference": Sparkles,
  "where-to-vote": MapPin,
  "register-to-vote": PenLine,
  "am-i-registered": BadgeCheck,
  "contact-representatives": MessageSquare,
  "call-governor": Phone,
  "city-council": Users,
  "public-comment-federal": FileText,
  petitions: Megaphone,
  volunteer: HandHeart,
  "know-your-rights": ShieldCheck,
  "run-for-office": Vote,
  learn: BookOpen,
}
const SORTED_STATES = [...STATES].sort((a, b) => a.name.localeCompare(b.name))

import type { Route } from "../lib/route.ts"
import { FinePrint, Tabs } from "./Chrome.tsx"
import { IconArrow } from "./Icons.tsx"
import {
  BadgeCheck,
  BookOpen,
  ChevronDown,
  FileText,
  HandHeart,
  Megaphone,
  MapPin,
  MessageSquare,
  PenLine,
  Phone,
  ShieldCheck,
  Sparkles,
  Users,
  Vote,
  type LucideIcon,
} from "lucide-react"
import { STATES, byAbbr } from "../data/states.ts"
import { governorRace, senateRaces } from "../data/elections.ts"

type Turn =
  | { role: "user"; text: string }
  | { role: "answer"; id: string }
  | { role: "results" }
  | { role: "fallback"; reason: "partisan" | "unknown" }

function useAffiliation() {
  return useSyncExternalStore(subscribe, affiliation, () => null)
}

export function Home({
  onCopy,
  route,
  onSettings,
}: {
  onCopy: (message: string) => void
  route: Route
  onSettings: () => void
}) {
  const party = useAffiliation()
  const [text, setText] = useState("")
  const [turns, setTurns] = useState<Turn[]>([])
  const [more, setMore] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  const threadRef = useRef<HTMLDivElement>(null)
  const scope = useSyncExternalStore(subscribe, scopeState, () => null)
  const scopeInfo = scope ? byAbbr(scope) : null
  const tipSeen = useSyncExternalStore(subscribe, stateTipSeen, () => true)
  const [tipOpen, setTipOpen] = useState(() => !stateTipSeen())
  const showTip = tipOpen && !tipSeen && !scope
  const tipRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!showTip) return
    const onDown = (event: PointerEvent) => {
      if (tipRef.current && !tipRef.current.contains(event.target as Node)) closeTip()
    }
    const t = window.setTimeout(() => document.addEventListener("pointerdown", onDown), 0)
    return () => {
      window.clearTimeout(t)
      document.removeEventListener("pointerdown", onDown)
    }
  }, [showTip])
  function closeTip() {
    setTipOpen(false)
    markStateTipSeen()
  }
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!turns.length) return
    const items = threadRef.current?.querySelectorAll(".user-msg")
    const last = items?.[items.length - 1] as HTMLElement | undefined
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    last?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" })
  }, [turns.length])

  function newQuestion() {
    setTurns([])
    setOpen(null)
    setText("")
    document.querySelector(".main")?.scrollTo({ top: 0 })
    inputRef.current?.focus()
  }

  const lastAnswer = [...turns].reverse().find((turn) => turn.role === "answer")
  const followups =
    lastAnswer && lastAnswer.role === "answer" ? ANSWER_MAP.get(lastAnswer.id)?.related ?? PRIMARY_IDS : null
  const base = CHIP_ORDER[party ?? "skip"] ?? PRIMARY_IDS
  const chips = followups ?? (more ? [...base, ...MORE_IDS] : base)

  function ask(value: string) {
    const trimmed = value.trim()
    if (!trimmed) return
    const match = matchQuestion(trimmed)
    if (match.kind === "learn") {
      go("#/learn")
      return
    }
    setTurns((current) => [
      ...current,
      { role: "user", text: trimmed },
      match.kind === "answer"
        ? { role: "answer", id: match.id }
        : match.kind === "results"
          ? { role: "results" }
          : { role: "fallback", reason: match.reason },
    ])
    setText("")
    setMore(false)
  }

  const composer = (
          <form
            className={turns.length ? "composer-wrap" : "composer-wrap hero-composer"}
            onSubmit={(event) => {
              event.preventDefault()
              ask(text)
            }}
          >
            <div className="composer">
              <label className="sr" htmlFor="ask">
                Your question
              </label>
              <input
                ref={inputRef}
                id="ask"
                value={text}
                placeholder="Ask a question"
                enterKeyHint="send"
                onChange={(event) => setText(event.target.value)}
              />
              <div className="scope">
                <label className="sr" htmlFor="scope">
                  State
                </label>
                <select
                  id="scope"
                  value={scope ?? ""}
                  onChange={(event) => {
                    setScopeState(event.target.value || null)
                    if (event.target.value) closeTip()
                  }}
                >
                  <option value="">All states</option>
                  {SORTED_STATES.map((item) => (
                    <option key={item.abbr} value={item.abbr}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <span className="scope-face" aria-hidden="true">
                  {scope ?? "All"}
                  <ChevronDown size={14} strokeWidth={1.75} />
                </span>
              </div>
              {text.trim() && (
                <button className="send" type="submit" aria-label="Send">
                  <span>
                    <IconArrow />
                  </span>
                </button>
              )}
            </div>
            {showTip && (
              <div className="tip" role="dialog" aria-label="Tip" ref={tipRef}>
                <span className="tip-arrow" aria-hidden="true" />
                <p>Pick a state to narrow things down, or just ask a general question.</p>
                <button className="tip-btn" type="button" onClick={closeTip}>
                  Got it
                </button>
              </div>
            )}
          </form>
  )

  return (
    <>
    <div className={turns.length ? "home-scroll" : "home-scroll home-start"}>
      <div className="column">
        <div className={turns.length ? "" : "home-center"}>
        <h1 className="hero">What do you want to change?</h1>
        {turns.length === 0 && composer}
        {turns.length === 0 && scopeInfo && (
          <p className="note scope-note">Showing steps for {scopeInfo.name}.</p>
        )}
        {turns.length > 0 && (
          <button className="pill-btn new-q" type="button" onClick={newQuestion}>
            New question
          </button>
        )}
        {turns.length === 0 && (
          <>
            <div className="tiles" aria-label="Suggested questions">
              {chips.map((id) => {
                const Icon = TILE_ICON[id] ?? MessageSquare
                const label = id === "learn" ? LEARN_CHIP : ANSWER_MAP.get(id)?.chip ?? id
                return (
                  <button
                    key={id}
                    className="tile"
                    type="button"
                    onClick={() => (id === "learn" ? go("#/learn") : ask(label))}
                  >
                    <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
                    <span>{label}</span>
                  </button>
                )
              })}
            </div>
            <button className="text-btn more-link" type="button" onClick={() => setMore((value) => !value)}>
              {more ? "Fewer questions" : "More questions"}
            </button>
          </>
        )}
        {!party && turns.length === 0 && (
          <>
            <div className="party-wrap">
            <div className="party" role="group" aria-label="Optional party affiliation">
              {(
                [
                  ["democrat", "Democrat"],
                  ["republican", "Republican"],
                  ["independent", "Independent"],
                  ["other", "Other"],
                  ["skip", "Skip"],
                ] as [Affiliation, string][]
              ).map(([id, label]) => (
                <button key={id} type="button" onClick={() => setAffiliation(id)}>
                  {label}
                </button>
              ))}
            </div>
            </div>
            <p className="note">This only changes which questions show first. Answers stay the same for everyone.</p>
          </>
        )}
        </div>
        <div className="thread" aria-live="polite" ref={threadRef}>
          {turns.map((turn, index) => {
            if (turn.role === "user") {
              return (
                <p className="user-msg" key={index}>
                  {turn.text}
                </p>
              )
            }
            if (turn.role === "answer") {
              const answer = ANSWER_MAP.get(turn.id)
              if (!answer) return null
              return (
                <article className="answer" key={index}>
                  <p>{answer.intro}</p>
                  {scopeInfo && (
                    <div className="scope-card">
                      <p className="sources-label">In {scopeInfo.name}</p>
                      {turn.id === "call-governor" && scopeInfo.governor ? (
                        <a href={scopeInfo.governor.url}>Governor {scopeInfo.governor.name} (serving now)</a>
                      ) : null}
                      {turn.id === "call-governor" && governorRace(scopeInfo.abbr)?.winner ? (
                        <p className="note">
                          {governorRace(scopeInfo.abbr)?.winner} ({governorRace(scopeInfo.abbr)?.party}) was elected Nov 3 and takes office in January 2027. Until then, call the current governor. Unofficial.
                        </p>
                      ) : null}
                      {turn.id === "contact-representatives" && senateRaces(scopeInfo.abbr).some((r) => r.winner) ? (
                        <p className="note">
                          2026 Senate winner{senateRaces(scopeInfo.abbr).filter((r) => r.winner).length > 1 ? "s" : ""}:{" "}
                          {senateRaces(scopeInfo.abbr)
                            .filter((r) => r.winner)
                            .map((r) => `${r.winner} (${r.party})${r.special ? ", special" : ""}`)
                            .join("; ")}
                          . Your current senators serve until the new term starts. Unofficial.
                        </p>
                      ) : null}
                      {turn.id === "city-council" || turn.id === "run-for-office" ? (
                        <a href={scopeInfo.ballotUrl}>{scopeInfo.name} sample ballot and local offices</a>
                      ) : null}
                      <a href={scopeInfo.electionUrl}>{scopeInfo.electionName}</a>
                      <a href={scopeInfo.legislatureUrl}>{scopeInfo.legislatureName}</a>
                    </div>
                  )}
                  {answer.actions.map((action, actionIndex) => {
                    const key = `${turn.id}-${actionIndex}`
                    return (
                      <section className="action" key={key}>
                        <h3>
                          {actionIndex + 1}. {action.title}
                        </h3>
                        <p className="meta">{action.time}</p>
                        <p className="why">Why: {action.why}</p>
                        <button
                          className="text-btn steps-btn"
                          type="button"
                          aria-expanded={open === key}
                          onClick={() => setOpen(open === key ? null : key)}
                        >
                          <ChevronDown size={18} strokeWidth={1.75} aria-hidden="true" className={open === key ? "chev up" : "chev"} />
                          {open === key ? "Hide steps" : "Show steps"}
                        </button>
                        {open === key && (
                          <ol className="steps">
                            {action.steps.map((step) => (
                              <li key={step}>{step}</li>
                            ))}
                          </ol>
                        )}
                        {action.script && (
                          <button className="text-btn" type="button" onClick={() => onCopy(action.script ?? "")}>
                            Copy script
                          </button>
                        )}
                        <div className="sources">
                          <p className="sources-label">Sources</p>
                          {action.links.map((link) => (
                            <a key={link.href} href={link.href}>
                              {link.label}
                            </a>
                          ))}
                        </div>
                      </section>
                    )
                  })}
                  <button className="pill-btn" type="button" onClick={newQuestion}>
                    New question
                  </button>
                </article>
              )
            }
            if (turn.role === "results") {
              return (
                <article className="answer" key={index}>
                  <p>Official counts are on the results map. This guide does not explain why people voted as they did.</p>
                  <button className="text-btn" type="button" onClick={() => go("#/map")}>
                    Open the map
                  </button>
                </article>
              )
            }
            if (turn.role !== "fallback") return null
            return (
              <article className="answer" key={index}>
                <p>
                  {turn.reason === "partisan"
                    ? "Speak Up does not recommend candidates, parties, or positions. You can still look up where to vote, contact an official, or read official counts."
                    : "I don't have a sourced answer for that. Try one of the questions below, or start at an official site."}
                </p>
                <div className="sources">
                  <p className="sources-label">Sources</p>
                  <a href="https://vote.gov/">Vote.gov</a>
                  <a href="https://www.usa.gov/elected-officials">Elected officials on USA.gov</a>
                  <a href="https://www.house.gov/representatives/find-your-representative">Find your representative</a>
                </div>
                <button className="pill-btn" type="button" onClick={newQuestion}>
                  New question
                </button>
              </article>
            )
          })}
        </div>
      </div>
    </div>
      <div className="dock">
        <div className="dock-inner">
          {turns.length > 0 && (
          <div className="chip-row fade-x">
            {chips.map((id) =>
              id === "learn" ? (
                <button key={id} className="chip" type="button" onClick={() => go("#/learn")}>
                  {LEARN_CHIP}
                </button>
              ) : (
                <button key={id} className="chip" type="button" onClick={() => ask(ANSWER_MAP.get(id)?.chip ?? id)}>
                  {ANSWER_MAP.get(id)?.chip}
                </button>
              ),
            )}
            {!followups && (
              <button className="chip" type="button" onClick={() => setMore((value) => !value)}>
                {more ? "Fewer questions" : "More questions"}
              </button>
            )}
          </div>
          )}
          <FinePrint />
          {turns.length > 0 && composer}
          <Tabs route={route} onSettings={onSettings} />
        </div>
      </div>
    </>
  )
}

export const ANSWER_COUNT = ANSWERS.length
