import { FormEvent, useState } from "react";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { api } from "../api";
import type { Session } from "../types";
import { Brand } from "./Brand";

export function AuthScreen({ onAuthenticated }: { onAuthenticated: (session: Session) => void }) {
  const [mode, setMode] = useState<"register" | "login">("register");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const values = new FormData(event.currentTarget);
    try {
      const session = mode === "register"
        ? await api.register({
            name: String(values.get("name")),
            email: String(values.get("email")),
            password: String(values.get("password")),
            privacy_consent: values.get("consent") === "on",
          })
        : await api.login({
            email: String(values.get("email")),
            password: String(values.get("password")),
          });
      localStorage.setItem("aimed_token", session.access_token);
      onAuthenticated(session);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to continue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-story">
        <Brand dark />
        <div className="auth-story__copy">
          <p className="eyebrow eyebrow--light">Your health record, connected</p>
          <h1>Clarity lives<br />in the details.</h1>
          <p className="auth-lede">Bring scattered reports, results, and notes into one private-feeling place—and ask questions in plain language.</p>
        </div>
        <div className="trust-note"><ShieldCheck size={20} /><span>Your files stay in your account. Only relevant passages are used for each answer.</span></div>
        <div className="story-orbit story-orbit--one" />
        <div className="story-orbit story-orbit--two" />
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <p className="eyebrow">Welcome to AI Med</p>
          <h2>{mode === "register" ? "Create your workspace" : "Welcome back"}</h2>
          <p className="muted">{mode === "register" ? "Start with synthetic or anonymized records while this product is in development." : "Sign in to continue to your medical history."}</p>
          <form onSubmit={submit}>
            {mode === "register" && <label>Full name<input name="name" required minLength={2} autoComplete="name" placeholder="Jordan Ellis" /></label>}
            <label>Email address<input name="email" required type="email" autoComplete="email" placeholder="you@example.com" /></label>
            <label>Password<input name="password" required type="password" minLength={10} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="At least 10 characters" /></label>
            {mode === "register" && (
              <label className="consent-row">
                <input name="consent" type="checkbox" required />
                <span>I understand that extracted text is sent to Gemini for AI features and consent to processing uploaded information.</span>
              </label>
            )}
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button--primary button--wide" disabled={loading}>
              {loading ? "Please wait…" : mode === "register" ? "Create workspace" : "Sign in"}<ArrowRight size={17} />
            </button>
          </form>
          <button className="text-button" onClick={() => { setMode(mode === "register" ? "login" : "register"); setError(""); }}>
            {mode === "register" ? "Already have an account? Sign in" : "New to AI Med? Create an account"}
          </button>
          <div className="privacy-line"><LockKeyhole size={14} /> Medical information deserves careful handling.</div>
        </div>
      </section>
    </main>
  );
}

