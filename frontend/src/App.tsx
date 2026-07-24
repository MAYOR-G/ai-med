import { useEffect, useState } from "react";
import { api } from "./api";
import { AuthScreen } from "./components/AuthScreen";
import { Dashboard } from "./pages/Dashboard";
import type { Session, User } from "./types";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem("aimed_token")) { setChecking(false); return; }
    api.me().then(setUser).catch(() => localStorage.removeItem("aimed_token")).finally(() => setChecking(false));
  }, []);

  function authenticated(session: Session) { setUser(session.user); }
  async function logout() { await api.logout().catch(() => undefined); localStorage.removeItem("aimed_token"); setUser(null); }

  if (checking) return <div className="app-loading"><span />Preparing your workspace…</div>;
  return user ? <Dashboard user={user} onLogout={logout} /> : <AuthScreen onAuthenticated={authenticated} />;
}

