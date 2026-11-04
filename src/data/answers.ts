export type SourceLink = { label: string; href: string }

export type Action = {
  title: string
  time: string
  why: string
  steps: string[]
  script?: string
  links: SourceLink[]
}

export type Answer = {
  id: string
  chip: string
  phrases: string[]
  keywords: string[]
  intro: string
  actions: Action[]
  related: string[]
}

const vote: SourceLink = { label: "Vote.gov", href: "https://vote.gov/" }
const canI: SourceLink = { label: "Can I Vote (state lookup)", href: "https://www.canivote.org/" }
const house: SourceLink = { label: "Find your U.S. representative", href: "https://www.house.gov/representatives/find-your-representative" }
const senate: SourceLink = { label: "Contact your U.S. senators", href: "https://www.senate.gov/senators/senators-contact.htm" }
const officials: SourceLink = { label: "Elected officials on USA.gov", href: "https://www.usa.gov/elected-officials" }
const rules: SourceLink = { label: "Regulations.gov", href: "https://www.regulations.gov/" }
const eac: SourceLink = { label: "Register and vote in your state (EAC)", href: "https://www.eac.gov/voters/register-and-vote-in-your-state" }
const voters: SourceLink = { label: "Voter resources (EAC)", href: "https://www.eac.gov/voters" }
const rights: SourceLink = { label: "Voting rights (Justice Department)", href: "https://www.justice.gov/crt/voting-section" }
const hotline: SourceLink = { label: "Call 866-OUR-VOTE", href: "tel:+18666878683" }
const local: SourceLink = { label: "Local governments on USA.gov", href: "https://www.usa.gov/local-governments" }
const elections: SourceLink = { label: "Voting and elections on USA.gov", href: "https://www.usa.gov/voting-and-elections" }
const register: SourceLink = { label: "Register to vote on USA.gov", href: "https://www.usa.gov/register-to-vote" }
const serve: SourceLink = { label: "AmeriCorps", href: "https://americorps.gov/" }
const governor: SourceLink = { label: "State governor contacts", href: "https://www.usa.gov/state-governor" }

const callScript =
  "Hello, my name is [your name]. I live in [your city]. I am calling about [your issue]. I would like you to [your ask]. Please share this with the office. Thank you."

export const ANSWERS: Answer[] = [
  {
    id: "make-a-difference",
    chip: "How do I make a difference?",
    phrases: ["make a difference", "what can i do", "get involved", "how do i help"],
    keywords: ["difference", "involved", "help", "participate", "action"],
    intro: "You can take part without a title. Pick one step you can finish today. This guide does not tell you what to support.",
    actions: [
      {
        title: "Tell an official what you want",
        time: "15 min",
        why: "Elected offices track calls and letters from the people they represent.",
        steps: [
          "Write one sentence about [your issue].",
          "Find your officials on the official lookup pages.",
          "Call or send the script. Use your own words.",
          "Give your city so they know you live in the area.",
        ],
        script: callScript,
        links: [house, senate, officials],
      },
      {
        title: "Show up where a decision is made",
        time: "2 hr",
        why: "City boards and councils take public comment before they vote.",
        steps: [
          "Find your city or county website from USA.gov.",
          "Open the next meeting agenda.",
          "Sign up to speak if the agenda allows it.",
          "Prepare a comment under two minutes about [your issue].",
        ],
        links: [local],
      },
    ],
    related: ["contact-representatives", "city-council", "volunteer", "learn"],
  },
  {
    id: "where-to-vote",
    chip: "Where do I vote?",
    phrases: ["where do i vote", "polling place", "where to vote", "ballot drop"],
    keywords: ["polling", "precinct", "vote center", "drop box", "election day"],
    intro: "Your polling place comes from your registration address. Use the official lookup. Do not rely on a forwarded social post.",
    actions: [
      {
        title: "Look up your polling place",
        time: "5 min",
        why: "States assign the place. It can change from one election to the next.",
        steps: [
          "Open Vote.gov or your state election office.",
          "Enter the address where you are registered.",
          "Read the place name, hours, and what to bring.",
          "Check whether your state uses early voting or mail ballots.",
        ],
        links: [vote, canI, eac],
      },
      {
        title: "Make a plan to cast a ballot",
        time: "10 min",
        why: "A plan makes it more likely you finish the steps your state requires.",
        steps: [
          "Choose election day, early voting, or a mail ballot if your state offers it.",
          "Put the hours on your calendar.",
          "Read the ID rules on your state election site.",
          "If you need a ride, ask someone you trust.",
        ],
        links: [elections],
      },
    ],
    related: ["am-i-registered", "register-to-vote", "know-your-rights"],
  },
  {
    id: "register-to-vote",
    chip: "How do I register to vote?",
    phrases: ["register to vote", "how do i register", "sign up to vote", "voter registration"],
    keywords: ["register", "registration form", "deadline"],
    intro: "Each state sets its own registration rules and deadline. Start with Vote.gov. It sends you to your state.",
    actions: [
      {
        title: "Check the deadline and the form",
        time: "5 min",
        why: "A form sent after the deadline does not add you for that election.",
        steps: [
          "Open Vote.gov and choose your state.",
          "Read who can register and the deadline.",
          "See if your state lets you register online, by mail, or in person.",
        ],
        links: [vote, register, eac],
      },
      {
        title: "Submit your registration",
        time: "15 min",
        why: "You need an active registration before you can vote in most states.",
        steps: [
          "Use the state form linked from Vote.gov.",
          "Enter your current address.",
          "Submit it the way the state asks.",
          "Look up your record later to confirm it was added.",
        ],
        links: [vote, canI],
      },
    ],
    related: ["am-i-registered", "where-to-vote", "know-your-rights"],
  },
  {
    id: "am-i-registered",
    chip: "Am I registered?",
    phrases: ["am i registered", "check my registration", "voter status", "registration status"],
    keywords: ["registered", "status", "inactive", "confirm"],
    intro: "You can check your own record on an official state lookup. This site cannot see registration rolls.",
    actions: [
      {
        title: "Search your registration",
        time: "5 min",
        why: "A move, a name change, or a missed election can make a record inactive.",
        steps: [
          "Open Can I Vote or your state election site.",
          "Enter your name and the address they ask for.",
          "Read whether the record is active.",
          "Note your polling place if it is listed.",
        ],
        links: [canI, vote],
      },
      {
        title: "Fix the record if something is wrong",
        time: "20 min",
        why: "An old address can send you to the wrong place.",
        steps: [
          "Follow the update link on the state site.",
          "Submit a new registration if the state tells you to.",
          "Check again after the state says the update posts.",
        ],
        links: [vote, eac],
      },
    ],
    related: ["register-to-vote", "where-to-vote", "know-your-rights"],
  },
  {
    id: "contact-representatives",
    chip: "How do I contact my representatives?",
    phrases: ["contact my representative", "contact my representatives", "call my senator", "write my congress", "email congress"],
    keywords: ["representative", "senator", "congress", "house", "senate"],
    intro: "Two U.S. senators represent your whole state. One U.S. representative represents your district. Use the official finders so you reach the right office.",
    actions: [
      {
        title: "Find the right offices",
        time: "10 min",
        why: "A message to the wrong district is not counted as a constituent contact.",
        steps: [
          "Use the House finder and enter your address.",
          "Use the Senate contact list and choose your state.",
          "Save the phone number and the official contact form.",
        ],
        links: [house, senate, officials],
      },
      {
        title: "Send a short message",
        time: "10 min",
        why: "Staff log the topic and the ask. A short message is easier to count.",
        steps: [
          "Say your name and city.",
          "Name [your issue] in one sentence.",
          "State [your ask] in one sentence.",
          "Be polite. Do not include threats or personal attacks.",
        ],
        script: callScript,
        links: [house, senate],
      },
    ],
    related: ["call-governor", "city-council", "public-comment-federal"],
  },
  {
    id: "call-governor",
    chip: "How do I call my governor?",
    phrases: ["call my governor", "contact the governor", "governor's office", "email the governor"],
    keywords: ["governor"],
    intro: "The governor runs the state executive branch. The office main line and the official website are the right places to call.",
    actions: [
      {
        title: "Open the official contact page",
        time: "5 min",
        why: "The number can change. The state site is the source to trust.",
        steps: [
          "Add your state in Your area, or open the USA.gov governor list.",
          "Use the phone on the official page.",
          "Call during posted office hours.",
        ],
        links: [governor],
      },
      {
        title: "Leave a clear request",
        time: "5 min",
        why: "The person who answers writes down your topic and your ask.",
        steps: [
          "Give your name and city.",
          "State [your issue].",
          "State [your ask].",
          "Leave a phone number if you want a call back.",
        ],
        script:
          "Hello, my name is [your name]. I live in [your city]. I am calling Governor [name]'s office about [your issue]. I would like the governor to [your ask]. Thank you.",
        links: [governor],
      },
    ],
    related: ["contact-representatives", "city-council", "learn"],
  },
  {
    id: "city-council",
    chip: "How do I speak at a city council meeting?",
    phrases: ["city council", "speak at a meeting", "public comment", "town council", "county commission"],
    keywords: ["council", "commission", "hearing", "agenda", "testify"],
    intro: "Cities set their own comment rules. The agenda and the clerk's page tell you how to sign up. Keep your comment on [your issue].",
    actions: [
      {
        title: "Find the next meeting",
        time: "15 min",
        why: "You can only speak on the schedule the city publishes.",
        steps: [
          "Find your city website from USA.gov.",
          "Open the council or board agenda.",
          "Read the public-comment rules and the time limit.",
          "Note the deadline to sign up.",
        ],
        links: [local],
      },
      {
        title: "Give a short comment",
        time: "10 min",
        why: "Meetings limit each person, often to two or three minutes.",
        steps: [
          "Sign up the way the agenda says.",
          "State your name and neighborhood if they ask.",
          "Say what you want the body to do about [your issue].",
          "Stop when your time ends.",
        ],
        script:
          "My name is [your name]. I live in [your neighborhood]. I am here about [your issue]. I ask the council to [your ask]. Thank you.",
        links: [local],
      },
    ],
    related: ["contact-representatives", "petitions", "public-comment-federal"],
  },
  {
    id: "public-comment-federal",
    chip: "How do I comment on a federal rule?",
    phrases: ["public comment", "federal rule", "regulations.gov", "proposed rule", "comment on a rule"],
    keywords: ["regulation", "rulemaking", "federal register", "docket"],
    intro: "Federal agencies must read public comments on many proposed rules. Regulations.gov is the official place to file one.",
    actions: [
      {
        title: "Find an open comment period",
        time: "15 min",
        why: "A comment after the deadline is not part of that record.",
        steps: [
          "Open Regulations.gov.",
          "Search for the topic in [your issue].",
          "Open a document that says comments are open.",
          "Read the deadline and the questions the agency asked.",
        ],
        links: [rules],
      },
      {
        title: "File your comment",
        time: "20 min",
        why: "The comment becomes part of the public record.",
        steps: [
          "Write what you want the agency to do about [your issue].",
          "Stick to facts and your own experience.",
          "Submit it on Regulations.gov before the deadline.",
          "Save the tracking number.",
        ],
        script:
          "I am [your name] from [your city]. I am commenting on [docket]. I ask the agency to [your ask] because [your reason].",
        links: [rules],
      },
    ],
    related: ["petitions", "contact-representatives", "city-council"],
  },
  {
    id: "petitions",
    chip: "How do petitions work?",
    phrases: ["petition", "ballot measure", "initiative", "referendum", "how do petitions work"],
    keywords: ["petition", "signatures", "ballot measure", "initiative"],
    intro: "Petition rules are different in every state. Some petitions ask an official for a meeting. Others try to put a question on the ballot. Your state election office has the official rules.",
    actions: [
      {
        title: "Learn the rule that applies",
        time: "20 min",
        why: "A petition with the wrong form or too few signatures does not qualify.",
        steps: [
          "Decide if you want a request to an official or a ballot question.",
          "Read the petition rules on your state election site.",
          "Note the signature count, the deadline, and who may sign.",
        ],
        links: [eac, elections],
      },
      {
        title: "Write a clear ask",
        time: "30 min",
        why: "Signers and clerks need to see exactly what the petition does.",
        steps: [
          "State [your issue] in one sentence.",
          "State [your ask] in one sentence.",
          "Use the official form if the state requires one.",
          "Do not promise a result the petition cannot deliver.",
        ],
        links: [elections],
      },
    ],
    related: ["city-council", "contact-representatives", "run-for-office"],
  },
  {
    id: "volunteer",
    chip: "How do I volunteer?",
    phrases: ["volunteer", "poll worker", "help an election", "serve my community"],
    keywords: ["volunteer", "poll worker", "precinct official"],
    intro: "You can help run an election or serve through a public program. Election offices hire poll workers. AmeriCorps is a federal service agency.",
    actions: [
      {
        title: "Offer to work an election",
        time: "20 min",
        why: "Poll workers check people in, hand out ballots, and close the polling place.",
        steps: [
          "Open your state election website.",
          "Find the poll worker or election worker page.",
          "Read the pay, the hours, and the training.",
          "Apply on that official page.",
        ],
        links: [voters, elections],
      },
      {
        title: "Look at national service",
        time: "15 min",
        why: "AmeriCorps lists service roles with public agencies and nonprofits.",
        steps: [
          "Open AmeriCorps.",
          "Filter for your state.",
          "Read the time commitment before you apply.",
        ],
        links: [serve],
      },
    ],
    related: ["where-to-vote", "make-a-difference", "know-your-rights"],
  },
  {
    id: "know-your-rights",
    chip: "What are my voting rights?",
    phrases: ["voting rights", "know your rights", "provisional ballot", "turned away", "voter intimidation"],
    keywords: ["rights", "provisional", "intimidation", "discrimination", "id"],
    intro: "Federal law protects the right to vote free from force and from certain kinds of discrimination. State rules still decide ID, deadlines, and ballots. This is not legal advice.",
    actions: [
      {
        title: "Read the official rights page",
        time: "10 min",
        why: "The Justice Department publishes the federal voting-rights rules.",
        steps: [
          "Open the Justice Department voting page.",
          "Read the section that matches your question.",
          "Check your state election site for local rules, including ID.",
        ],
        links: [rights, eac],
      },
      {
        title: "Save help before election day",
        time: "2 min",
        why: "Problems are easier to fix if you know who to call.",
        steps: [
          "Save 866-OUR-VOTE in your phone.",
          "If you are challenged at the polls, ask for a provisional ballot.",
          "Tell a poll worker and call the line. Report what you saw.",
          "Call your state election office about local procedure.",
        ],
        links: [hotline, rights],
      },
    ],
    related: ["where-to-vote", "am-i-registered", "register-to-vote"],
  },
  {
    id: "run-for-office",
    chip: "How do I run for office?",
    phrases: ["run for office", "become a candidate", "file for office", "get on the ballot"],
    keywords: ["candidate", "filing", "ballot access", "qualifications"],
    intro: "Ballot access is run by your state or local election office. This guide does not recruit candidates or suggest a party.",
    actions: [
      {
        title: "Ask how to file",
        time: "30 min",
        why: "Offices, forms, fees, and deadlines are set in state law.",
        steps: [
          "Open your state election website.",
          "Find the candidate filing page.",
          "Read the qualifications for the office you want.",
          "Write down the filing deadline.",
        ],
        links: [eac, elections],
      },
      {
        title: "Follow the filing steps",
        time: "1 hr",
        why: "A missed form can keep a name off the ballot.",
        steps: [
          "Fill out the official candidate form.",
          "Meet the signature or fee rule the state lists.",
          "File it where the instructions say.",
          "Ask the office how you will be notified that you qualified.",
        ],
        links: [elections],
      },
    ],
    related: ["register-to-vote", "city-council", "petitions"],
  },
]

export const ANSWER_MAP = new Map(ANSWERS.map((answer) => [answer.id, answer]))

export const PRIMARY_IDS = [
  "make-a-difference",
  "where-to-vote",
  "am-i-registered",
  "contact-representatives",
  "call-governor",
  "city-council",
]

export const MORE_IDS = [
  "register-to-vote",
  "public-comment-federal",
  "petitions",
  "volunteer",
  "know-your-rights",
  "run-for-office",
  "learn",
]

export const CHIP_ORDER: Record<string, string[]> = {
  democrat: ["make-a-difference", "contact-representatives", "city-council", "where-to-vote", "am-i-registered", "call-governor"],
  republican: ["where-to-vote", "call-governor", "contact-representatives", "am-i-registered", "city-council", "make-a-difference"],
  independent: ["make-a-difference", "where-to-vote", "contact-representatives", "city-council", "am-i-registered", "call-governor"],
  other: ["make-a-difference", "where-to-vote", "contact-representatives", "city-council", "am-i-registered", "call-governor"],
  skip: PRIMARY_IDS,
}

export const LEARN_CHIP = "How does government work?"
