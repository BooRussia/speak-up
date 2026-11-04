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

  const reach = /\b(contact|call|email|e mail|write|text|reach|message|talk to|speak to|phone|letter to|tell)\b/
  if (reach.test(query)) {
    if (/\bgovernor\b/.test(query)) return { kind: "answer", id: "call-governor" }
    if (/\b(senator|senators|representative|representatives|rep|reps|congressman|congresswoman|congressperson|congress|member of congress|lawmaker|lawmakers|legislator|legislators)\b/.test(query))
      return { kind: "answer", id: "contact-representatives" }
    if (/\b(mayor|city council|council member|councilmember|commissioner)\b/.test(query)) return { kind: "answer", id: "city-council" }
  }
  if (/\bwho (is|are) my (senator|senators|representative|representatives|rep|reps|congressman|congresswoman)\b/.test(query))
    return { kind: "answer", id: "contact-representatives" }

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
  if (best < 2 || !bestId) return { kind: "fallback", reason: "unknown" }
  return { kind: "answer", id: bestId }
}
