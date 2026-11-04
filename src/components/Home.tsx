import { useState } from "react"
import { useSyncExternalStore } from "react"
import { ANSWER_MAP, ANSWERS, CHIP_ORDER, LEARN_CHIP, MORE_IDS, PRIMARY_IDS } from "../data/answers.ts"
import { matchQuestion } from "../lib/match.ts"
import { go } from "../lib/route.ts"
import { affiliation, setAffiliation, subscribe, type Affiliation } from "../lib/storage.ts"
import type { Route } from "../lib/route.ts"
import { FinePrint, Tabs } from "./Chrome.tsx"
import { IconArrow } from "./Icons.tsx"

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

  return (
    <>
    <div className="home-scroll">
      <div className="column">
        <h1 className="hero">What do you want to change?</h1>
        {!party && (
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
        <div className="thread" aria-live="polite">
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
                          className="text-btn"
                          type="button"
                          aria-expanded={open === key}
                          onClick={() => setOpen(open === key ? null : key)}
                        >
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
                  <button className="text-btn" type="button" onClick={() => setTurns([])}>
                    Start over
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
              </article>
            )
          })}
        </div>
      </div>
    </div>
      <div className="dock">
        <div className="dock-inner">
          <div className="chip-row">
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
          <FinePrint />
          <Tabs route={route} onSettings={onSettings} />
          <form
            className="composer-wrap"
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
                id="ask"
                value={text}
                placeholder="Ask a question"
                enterKeyHint="send"
                onChange={(event) => setText(event.target.value)}
              />
              {text.trim() && (
                <button className="send" type="submit" aria-label="Send">
                  <span>
                    <IconArrow />
                  </span>
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export const ANSWER_COUNT = ANSWERS.length
