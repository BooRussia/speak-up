import congress from "./generated/congress.json"
import type { Counts } from "../lib/hemicycle.ts"

export type CongressFile = {
  sample: boolean
  source: string
  sourceUrl: string
  fetched: string
  senate: Counts
  house: Counts
  independents: { name: string; state: string; chamber: string; caucus: string | null; district: number | null }[]
  unlistedSenate: string[]
  unlistedHouse: string[]
  byState: Record<
    string,
    {
      senators: Official[]
      representatives: Official[]
      delegate: Official | null
    }
  >
}

export type Official = {
  name: string
  party: string
  caucus: string | null
  phone: string | null
  contact: string | null
  url: string | null
  district: number | null
  rank: string | null
}

export const CONGRESS = congress as CongressFile

export const NOW_NOTE =
  "Seat counts come from unitedstates/congress-legislators legislators-current, fetched Nov 4, 2026. Two Senate terms in that file end Nov 3, 2026, with no successor listed (Florida and Ohio). Two House districts are not listed (FL-20 and TX-23)."

export const PROJECTED = {
  label: "Starting Jan 3, 2027 (120th Congress)",
  asOf: "Projected · results still coming in · updated Nov 4, 2:30 PM ET",
  detail:
    "Unofficial. Senate: Democrats projected at 54 seats including 2 independents who caucus with them, Republicans 44, with Alaska and Mississippi uncalled. House: Democrats projected to hold the majority; the AP count shows 237 Democratic, 139 Republican and 59 uncalled. Winners take office Jan 3, 2027.",
  sources: [
    { label: "Guardian (AP data)", href: "https://www.theguardian.com/us-news/ng-interactive/2026/nov/04/midterm-elections-full-results-senate-house-governor-races" },
    { label: "CBS News", href: "https://www.cbsnews.com/live-updates/senate-election-results-2026/" },
    { label: "NPR balance of power", href: "https://www.npr.org/2026/11/03/g-s1-149526/2026-midterms-congress-balance-of-power" },
  ],
  senate: {
    democrat: 52,
    republican: 44,
    independent: 2,
    unlisted: 0,
    uncalled: 2,
    total: 100,
  } satisfies Counts,
  house: {
    democrat: 237,
    republican: 139,
    independent: 0,
    unlisted: 0,
    uncalled: 59,
    total: 435,
  } satisfies Counts,
}

export const COURT = {
  republicanAppointed: 6,
  democraticAppointed: 3,
  note: "Counted by the party of the president who appointed each justice, not by how the justice votes. Confirm the current bench at supremecourt.gov if a seat has changed.",
}

export const BRANCHES = [
  {
    id: "president",
    kicker: "Executive",
    title: "President",
    meta: "Donald Trump",
    party: "R" as const,
    body: [
      "The President leads the executive branch, signs or vetoes bills, and is commander in chief of the armed forces.",
      "Voters choose electors. The electors choose the President.",
      "The term is 4 years. A person may be elected twice.",
    ],
  },
  {
    id: "vice",
    title: "Vice President",
    meta: "JD Vance",
    party: "R" as const,
    body: [
      "The Vice President is next in line if the President cannot serve, and votes in the Senate when there is a tie.",
      "The Vice President is elected with the President.",
      "The term is 4 years.",
    ],
  },
  {
    id: "cabinet",
    title: "Cabinet and agencies",
    meta: "Departments that carry out the laws",
    body: [
      "Cabinet secretaries run departments such as State, Defense, and Justice. Agencies write rules and carry out programs.",
      "The President nominates secretaries. The Senate votes on whether to confirm them.",
      "They serve until they leave, the President replaces them, or the term ends.",
    ],
  },
  {
    id: "senate",
    kicker: "Legislative",
    title: "Senate",
    meta: "100 seats",
    body: [
      "The Senate writes and votes on bills. It also confirms federal judges and Cabinet nominees.",
      "Voters in each state elect two senators.",
      "The term is 6 years. About one third of the seats are on the ballot every 2 years.",
    ],
  },
  {
    id: "house",
    title: "House",
    meta: "435 voting seats",
    body: [
      "The House writes and votes on bills. Bills that raise taxes start here.",
      "Voters in each district elect one representative. Some states have one at-large seat.",
      "The term is 2 years. All 435 voting seats are on the ballot every 2 years.",
    ],
  },
  {
    id: "supreme",
    kicker: "Judicial",
    title: "Supreme Court",
    meta: "9 justices",
    body: [
      "The Supreme Court decides cases about the Constitution and federal law. It can strike down a law that conflicts with the Constitution.",
      "The President nominates a justice. The Senate votes on whether to confirm the nominee.",
      "Justices serve for life, unless they retire or are removed.",
    ],
  },
  {
    id: "lower-courts",
    title: "Appeals and district courts",
    meta: "The rest of the federal courts",
    body: [
      "District courts hold trials. Appeals courts review those decisions. Most cases stop there.",
      "The President nominates these judges. The Senate votes on whether to confirm them.",
      "They serve for life, unless they retire or are removed.",
    ],
  },
]
