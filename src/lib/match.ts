import { ANSWERS } from "../data/answers.ts"

export type Match =
  | { kind: "answer"; id: string }
  | { kind: "learn" }
  | { kind: "results" }
  | { kind: "fallback"; reason: "partisan" | "unknown" }

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim()
}

const PARTISAN =
  /\b(who should i vote|who do i vote for|best candidate|which party|vote (democrat|republican)|is (democrat|republican) better)\b/

export function matchQuestion(input: string): Match {
  const query = normalize(input)
  if (!query) return { kind: "fallback", reason: "unknown" }
  if (/how does government work|three branches|what does congress do|divided government/.test(query)) {
    return { kind: "learn" }
  }
  if (/who won|election results|results map|see the map/.test(query)) return { kind: "results" }
  if (PARTISAN.test(query)) return { kind: "fallback", reason: "partisan" }

  let bestId = ""
  let best = 0
  for (const answer of ANSWERS) {
    let score = 0
    for (const phrase of answer.phrases) {
      if (query.includes(normalize(phrase))) score += 8
    }
    const tokens = new Set(query.split(" "))
    for (const keyword of answer.keywords) {
      if (query.includes(keyword) || tokens.has(keyword)) score += 2
    }
    if (score > best) {
      best = score
      bestId = answer.id
    }
  }
  if (best < 4 || !bestId) return { kind: "fallback", reason: "unknown" }
  return { kind: "answer", id: bestId }
}
