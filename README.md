# Speak Up

A static, nonpartisan, mobile-first guide to concrete civic steps. No account, no ads, no tracking. Official links only.

## Run locally

```bash
npm install
npm run dev
```

The dev server uses the GitHub Pages base path, so open `/speak-up/`.

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 47331
```

Routes are hash URLs: `#/`, `#/learn`, `#/area`, `#/map`, `#/map/FL`, `#/map/FL/Marion`.

## Edit an answer

Answers live in `src/data/answers.ts`. Each entry has:

- `chip` — the question shown on a chip
- `phrases` and `keywords` — what the matcher looks for
- `intro` — the plain-language answer
- `actions` — numbered steps with a time, a why line, optional script, and links
- `related` — follow-up chips, including `learn` for the government page

Keep the voice verb-first and about an 8th-grade reading level. Do not recommend a party, a candidate, or a position. Use placeholders such as `[your issue]` and `[your ask]`.

Every `href` must be a `.gov` page, an official state site, `https://www.canivote.org/`, or the `tel:+18666878683` line for 866-OUR-VOTE. A few official state hosts are not on `.gov`: `flgov.com` (Florida governor) and `dcboe.org` (D.C. Board of Elections).

Suggested questions are reordered in `CHIP_ORDER`. That order is the only thing a saved party choice changes.

## Refresh the bundled data

Congress contacts:

```bash
npx tsx scripts/build-legislators.ts
```

This downloads `legislators-current.json` from unitedstates/congress-legislators and writes `src/data/generated/congress.json`. If the download fails, it does not invent a roster. `npx tsx scripts/build-legislators.ts --sample` writes a fake file and sets `sample: true`.

Election results:

```bash
npx tsx scripts/build-results.ts
```

This downloads MIT Election Data and Science Lab county presidential returns for 2024 and the lab's 2024 Senate county file, and writes `src/data/generated/results.json` keyed by FIPS. Governor and U.S. House county winners are not in those files, so the map leaves those views blank. `--sample` replaces the whole file with fake layout numbers. Real rows and sample rows are never mixed.

State offices and governor main lines are hand-maintained in `src/data/states.ts`. The map shapes are the us-atlas `states-10m` and `counties-10m` files in `src/data/geo/`.

## What is real

- Presidential county and state totals: MIT Election Lab county returns, version dated 2026-02-25.
- Senate county totals: MIT Election Lab 2024 Senate county file, for states that held a Senate election. Nebraska's fill is the regular election; the special election is not drawn.
- U.S. House and Senate contacts, and the "Now (119th Congress)" dot counts: legislators-current fetched Nov 4, 2026.
- Governor names: National Governors Association list reviewed Nov 4, 2026. Phones are office main lines and should be confirmed on the linked page.

## What is not real

- Governor and U.S. House **election** fills. Those controls stay empty on purpose.
- "Starting Jan 3, 2027" chamber dots. They are marked projected as of Nov 4, 2026 (Senate reported about 53–47 Democratic; House Democratic seats reported as 252–255). The House chart draws 253 and 182 so every dot has a place.
- State legislature rosters and local officials. Those rows link to the official lookup.
- A ZIP prefix gives the state only, not a House district.

## Deploy

`.github/workflows/pages.yml` builds the site and deploys `dist/` to GitHub Pages. Vite `base` is `/speak-up/`. In the repository settings, set Pages to GitHub Actions.
