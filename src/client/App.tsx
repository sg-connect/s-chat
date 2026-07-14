import { useEffect, useState } from "react";
import { useRealtimeKitClient } from "@cloudflare/realtimekit-react";
import { RtkMeeting } from "@cloudflare/realtimekit-react-ui";

type Screen = "checking" | "pin" | "setup" | "joining" | "call" | "left";

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, { credentials: "same-origin", ...options });
  const body: T & { error?: string } = await response.json();
  if (!response.ok) throw new Error(body.error ?? "Something went wrong");
  return body;
}

function NotFound(): React.JSX.Element {
  return <main className="page-shell"><section className="card"><p className="eyebrow">Family Call</p><h1>Page not found</h1><p>Use the family link to open the call.</p><a className="button" href="/family">Go to Family Call</a></section></main>;
}

function CallView({ token, audio, video, onLeave }: { token: string; audio: boolean; video: boolean; onLeave: () => void }): React.JSX.Element {
  const [meeting, initMeeting] = useRealtimeKitClient({ resetOnLeave: true });
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void initMeeting({ authToken: token, defaults: { audio, video } }).catch(() => {
      if (active) setError("Unable to start the call. Check your connection and try again.");
    });
    return () => { active = false; };
  }, [audio, initMeeting, token, video]);

  if (error) return <main className="page-shell dark"><section className="card"><h1>Unable to join</h1><p role="alert">{error}</p><button className="button" onClick={onLeave}>Try again</button></section></main>;
  if (!meeting) return <main className="page-shell dark"><p className="call-status" role="status">Joining family call…</p></main>;

  return (
    <main className="call-shell">
      <RtkMeeting meeting={meeting} mode="fill" showSetupScreen leaveOnUnmount />
      <button className="exit-call" onClick={onLeave}>Leave and return</button>
    </main>
  );
}

function FamilyPage(): React.JSX.Element {
  const [screen, setScreen] = useState<Screen>("checking");
  const [csrf, setCsrf] = useState("");
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [audio, setAudio] = useState(true);
  const [video, setVideo] = useState(true);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void api<{ authenticated: boolean; csrfToken?: string }>("/api/auth/session")
      .then((result) => {
        if (result.authenticated && result.csrfToken) { setCsrf(result.csrfToken); setScreen("setup"); }
        else setScreen("pin");
      })
      .catch(() => { setError("Unable to check access. Please refresh the page."); setScreen("pin"); });
  }, []);

  async function submitPin(event: React.FormEvent): Promise<void> {
    event.preventDefault(); setError("");
    try {
      const result = await api<{ csrfToken: string }>("/api/auth/pin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin }) });
      setCsrf(result.csrfToken); setPin(""); setScreen("setup");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Incorrect PIN"); }
  }

  async function join(event: React.FormEvent): Promise<void> {
    event.preventDefault(); setError(""); setScreen("joining");
    try {
      const result = await api<{ token: string }>("/api/call/join", { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf }, body: JSON.stringify({ displayName: name }) });
      setToken(result.token); setScreen("call");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to join"); setScreen("setup"); }
  }

  async function logout(): Promise<void> {
    await api("/api/auth/logout", { method: "POST", headers: { "X-CSRF-Token": csrf } }).catch(() => undefined);
    setToken(""); setCsrf(""); setName(""); setScreen("pin");
  }

  if (screen === "call" && token) return <CallView token={token} audio={audio} video={video} onLeave={() => { setToken(""); setScreen("left"); }} />;

  return (
    <main className="page-shell">
      <section className="card" aria-labelledby="title">
        <div className="family-mark" aria-hidden="true">FC</div>
        <p className="eyebrow">Private family room</p><h1 id="title">Family Call</h1>
        {screen === "checking" && <p className="status" role="status">Checking access…</p>}
        {screen === "pin" && <form onSubmit={(event) => void submitPin(event)}><label htmlFor="pin">Enter family PIN</label><input id="pin" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))} required /><button className="button" type="submit">Continue</button></form>}
        {(screen === "setup" || screen === "joining") && <form onSubmit={(event) => void join(event)}><p>Your camera preview and device choices appear on the next screen. Camera and microphone start on so everyone can see and hear you; turn either one off here if you prefer.</p><label htmlFor="name">Your name</label><input id="name" maxLength={40} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required /><div className="toggles"><label><input type="checkbox" checked={audio} onChange={(event) => setAudio(event.target.checked)} /> Microphone on</label><label><input type="checkbox" checked={video} onChange={(event) => setVideo(event.target.checked)} /> Camera on</label></div><button className="button" type="submit" disabled={screen === "joining"}>{screen === "joining" ? "Joining…" : "Join family call"}</button><button className="text-button" type="button" onClick={() => void logout()}>Use a different PIN</button></form>}
        {screen === "left" && <><p className="status">Call left</p><button className="button" onClick={() => setScreen("setup")}>Join again</button><button className="text-button" onClick={() => void logout()}>Log out</button></>}
        {error && <p className="error" role="alert" aria-live="polite">{error}</p>}
      </section>
    </main>
  );
}

export function App(): React.JSX.Element {
  return window.location.pathname === "/family" ? <FamilyPage /> : <NotFound />;
}
