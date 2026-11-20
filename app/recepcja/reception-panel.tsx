"use client";

import { ArrowRight, LockKeyhole, Plus, UserRound } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { clinic } from "../../lib/site";
import { getClinicTime } from "../../lib/clinic-time";
import { ReceptionCalendar } from "./reception-calendar";

export function ReceptionPanel({ initialDay, activation }: { initialDay: number | null; activation: boolean }) {
  const [today, setToday] = useState(initialDay);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [activated, setActivated] = useState(false);
  const invitation = useRef("");

  useEffect(() => {
    if (!activation || !window.location.hash) return;
    invitation.current = new URLSearchParams(window.location.hash.slice(1)).get("kod") ?? "";
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }, [activation]);

  const expireSession = useCallback(() => {
    setToday(null);
    setError("Sesja wygasła. Zaloguj się ponownie.");
  }, []);

  async function openCalendar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    try {
      const result = await fetch("/api/reception/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      if (result.ok) {
        setToday(getClinicTime(Date.now()).day);
      } else {
        const data = await result.json().catch(() => null);
        setError(data?.message ?? "Logowanie jest chwilowo niedostępne.");
      }
    } catch {
      setError("Logowanie jest chwilowo niedostępne.");
    } finally {
      setPending(false);
    }
  }

  async function signOut() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const result = await fetch("/api/reception/session", { method: "DELETE" });
      if (!result.ok) throw new Error("Could not sign out");
      setToday(null);
    } catch {
      setError("Nie udało się wylogować. Spróbuj ponownie.");
    } finally {
      setPending(false);
    }
  }

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const password = new FormData(event.currentTarget).get("password");
    setPending(true);
    setError("");
    try {
      const result = await fetch("/api/reception/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, code: invitation.current }),
      });
      if (result.ok) {
        invitation.current = "";
        setActivated(true);
      } else {
        const data = await result.json().catch(() => null);
        setError(data?.message ?? "Nie udało się aktywować konta.");
      }
    } catch {
      setError("Nie udało się aktywować konta. Spróbuj ponownie.");
    } finally {
      setPending(false);
    }
  }

  if (today !== null) {
    return (
      <ReceptionCalendar
        today={today}
        onSignOut={signOut}
        onSessionExpired={expireSession}
        sessionError={error}
        signingOut={pending}
      />
    );
  }

  return (
    <main id="tresc" className="reception-entry">
      <div className="reception-sign-in">
        <div className="reception-brand wordmark">
          <span className="wordmark-icon" aria-hidden="true"><Plus size={23} strokeWidth={2.55} /></span>
          {clinic.name}
        </div>
        <h1>{activation ? "Aktywuj konto recepcji" : "Panel recepcji"}</h1>
        {activation ? activated ? (
          <div className="reception-activation-success">
            <p>Konto jest gotowe. Zaloguj się podanym adresem e-mail i ustawionym hasłem.</p>
            <a href="/recepcja" className="button button-primary">Przejdź do logowania</a>
          </div>
        ) : (
          <form method="post" onSubmit={createAccount}>
            <div className="reception-field">
              <label htmlFor="reception-new-password">Ustaw hasło do konta recepcji</label>
              <div className="reception-input">
                <LockKeyhole size={17} aria-hidden="true" />
                <input id="reception-new-password" name="password" type="password" autoComplete="new-password"
                  placeholder="Co najmniej 12 znaków" required minLength={12} maxLength={72} />
              </div>
            </div>
            {error ? <p className="reception-error" role="alert">{error}</p> : null}
            <button className="button button-primary reception-submit" type="submit" disabled={pending}>
              {pending ? "Aktywowanie…" : "Ustaw hasło"}
              <ArrowRight size={17} aria-hidden="true" />
            </button>
          </form>
        ) : (
        <>
        <p>Zaloguj się na konto recepcji, aby otworzyć terminarz.</p>
        <form method="post" onSubmit={openCalendar}>
          <div className="reception-field">
            <label htmlFor="reception-login">Adres e-mail</label>
            <div className="reception-input">
              <UserRound size={17} aria-hidden="true" />
              <input id="reception-login" name="email" type="email" autoComplete="username" required maxLength={254} />
            </div>
          </div>
          <div className="reception-field">
            <label htmlFor="reception-password">Hasło</label>
            <div className="reception-input">
              <LockKeyhole size={17} aria-hidden="true" />
              <input id="reception-password" name="password" type="password" autoComplete="current-password" required maxLength={1024} />
            </div>
          </div>
          {error ? <p className="reception-error" role="alert">{error}</p> : null}
          <button className="button button-primary reception-submit" type="submit" disabled={pending}>
            {pending ? "Logowanie…" : "Zaloguj się"}
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        </form>
        </>
        )}
      </div>
    </main>
  );
}
