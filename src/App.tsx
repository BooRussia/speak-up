import { lazy, Suspense, useEffect, useState } from "react"
import { useSyncExternalStore } from "react"
import { AreaView } from "./components/AreaView.tsx"
import { Nav, Sheet, Tabs } from "./components/Chrome.tsx"
import { Home } from "./components/Home.tsx"
import { LearnView } from "./components/LearnView.tsx"
import { ResultsView } from "./components/ResultsView.tsx"
import { parseHash } from "./lib/route.ts"
import {
  applyTheme,
  clearPersonalInfo,
  colorblind,
  setColorblind,
  setTheme,
  subscribe,
  themeChoice,
  type ThemeChoice,
} from "./lib/storage.ts"

const MapView = lazy(() => import("./components/MapView.tsx"))

function useHash() {
  const [hash, setHash] = useState(() => window.location.hash || "#/")
  useEffect(() => {
    const onChange = () => setHash(window.location.hash || "#/")
    window.addEventListener("hashchange", onChange)
    return () => window.removeEventListener("hashchange", onChange)
  }, [])
  return hash
}

export default function App() {
  const hash = useHash()
  const route = parseHash(hash)
  const [settings, setSettings] = useState(false)
  const [about, setAbout] = useState(false)
  const [toast, setToast] = useState("")
  const [cleared, setCleared] = useState(false)
  const theme = useSyncExternalStore(subscribe, themeChoice, () => "system" as ThemeChoice)
  const patterns = useSyncExternalStore(subscribe, colorblind, () => false)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    const titles: Record<string, string> = {
      notfound: "Page not found · Speak Up",
      home: "Speak Up",
      learn: "How government works · Speak Up",
      area: "Your area · Speak Up",
      map: "Results map · Speak Up",
      results: "2026 results · Speak Up",
    }
    document.title = titles[route.name]
  }, [route.name])

  useEffect(() => {
    const sync = () => {
      const height = window.visualViewport?.height ?? window.innerHeight
      document.documentElement.style.setProperty("--app-h", `${Math.round(height)}px`)
    }
    sync()
    window.visualViewport?.addEventListener("resize", sync)
    window.visualViewport?.addEventListener("scroll", sync)
    window.addEventListener("resize", sync)
    return () => {
      window.visualViewport?.removeEventListener("resize", sync)
      window.visualViewport?.removeEventListener("scroll", sync)
      window.removeEventListener("resize", sync)
    }
  }, [])

  function copy(message: string) {
    const done = () => {
      setToast("Copied")
      window.setTimeout(() => setToast(""), 1600)
    }
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(message).then(done).catch(() => setToast("Could not copy"))
      return
    }
    setToast("Could not copy")
  }

  return (
    <div className="app">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Nav route={route} onSettings={() => setSettings(true)} />
      <main id="main" className={route.name === "map" ? "main map-main" : "main"}>
        {route.name === "home" && <Home onCopy={copy} route={route} onSettings={() => setSettings(true)} />}
        {route.name === "learn" && <LearnView />}
        {route.name === "results" && <ResultsView section={route.section} />}
        {route.name === "notfound" && (
          <div className="column">
            <h1 className="hero">Page not found</h1>
            <p>That link does not go anywhere in Speak Up. It may be mistyped or out of date.</p>
            <div className="btn-row">
              <a className="pill-btn" href="#/">Ask a question</a>
              <a className="pill-btn" href="#/map">Open the map</a>
            </div>
          </div>
        )}
        {route.name === "area" && <AreaView />}
        {route.name === "map" && (
          <Suspense
            fallback={
              <div className="column" role="status">
                <p className="note">Loading map…</p>
                <div className="skeleton" />
                <div className="skeleton w2" />
                <div className="skeleton w3" />
              </div>
            }
          >
            <MapView stateCode={route.state} countyName={route.county} />
          </Suspense>
        )}
      </main>
      {route.name !== "home" && <Tabs route={route} onSettings={() => setSettings(true)} />}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
      <Sheet open={settings} title="Settings" onClose={() => setSettings(false)}>
        <p className="kicker">Theme</p>
        <div className="choice" role="group" aria-label="Theme">
          {(["dark", "light", "system"] as ThemeChoice[]).map((choice) => (
            <button key={choice} type="button" aria-pressed={theme === choice} onClick={() => setTheme(choice)}>
              {choice === "dark" ? "Dark" : choice === "light" ? "Light" : "System"}
            </button>
          ))}
        </div>
        <p className="kicker">Map</p>
        <button className="text-btn" type="button" aria-pressed={patterns} onClick={() => setColorblind(!patterns)}>
          {patterns ? "Colorblind patterns on" : "Turn on colorblind patterns"}
        </button>
        <p className="kicker">This browser</p>
        <button
          className="text-btn"
          type="button"
          onClick={() => {
            clearPersonalInfo()
            setCleared(true)
          }}
        >
          Clear my info
        </button>
        {cleared && <p>Cleared. Party and place were removed from this browser.</p>}
        <button className="text-btn" type="button" onClick={() => { setSettings(false); setAbout(true) }}>
          About
        </button>
        <p className="fine">Nonpartisan. No ads, no tracking. Links go to official sources.</p>
      </Sheet>
      <Sheet open={about} title="About" onClose={() => setAbout(false)}>
        <p>Speak Up is a nonpartisan guide to steps you can take in public life. It does not tell you who to vote for or what position to take.</p>
        <p>Answers are written by hand and link to official sources. If a question is not in the guide, it says so.</p>
        <p>A party choice only reorders suggested questions. It does not change facts, colors, or sources.</p>
        <p>Your place and party choice stay in this browser. There is no account, no ad, and no tracker.</p>
        <p>The results map uses MIT Election Lab county returns for president in 2024 and for Senate races in 2024. Governor and U.S. House county winners are not in that bundle, so those views stay blank.</p>
        <p>Congress contacts come from the unitedstates/congress-legislators file fetched Nov 4, 2026. The 2027 chamber chart and the 2026 results page use unofficial AP calls as reported by news outlets, updated Nov 4, 2:30 PM ET. Each race links its source.</p>
      </Sheet>
    </div>
  )
}
