"use client";

import { ArrowRight, LockKeyhole, Plus, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { clinic } from "../../lib/site";
import { getClinicTime } from "../../lib/clinic-time";
import { ReceptionCalendar, type ReceptionAppointment } from "./reception-calendar";

const appointments: readonly ReceptionAppointment[] = [];

export function ReceptionPanel() {
  const [today, setToday] = useState<number | null>(null);

  function openCalendar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setToday(getClinicTime(Date.now()).day);
  }

  if (today !== null) {
    return (
      <ReceptionCalendar
        today={today}
        appointments={appointments}
        onSignOut={() => setToday(null)}
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
        <h1>Panel recepcji</h1>
        <p>Otwórz kalendarz wizyt gabinetu.</p>
        <form onSubmit={openCalendar} autoComplete="off">
          <div className="reception-field">
            <label htmlFor="reception-login">Login</label>
            <div className="reception-input">
              <UserRound size={17} aria-hidden="true" />
              <input id="reception-login" type="text" placeholder="Wpisz login" spellCheck={false} />
            </div>
          </div>
          <div className="reception-field">
            <label htmlFor="reception-password">Hasło</label>
            <div className="reception-input">
              <LockKeyhole size={17} aria-hidden="true" />
              <input id="reception-password" type="password" placeholder="Wpisz hasło" />
            </div>
          </div>
          <button className="button button-primary reception-submit" type="submit">
            Przejdź do kalendarza
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        </form>
        <p className="reception-demo-note">Tryb demonstracyjny. Możesz wpisać dowolne dane.</p>
      </div>
    </main>
  );
}
