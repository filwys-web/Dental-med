"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { formatBookingDate, getClinicTime, parseBookingDate, type ClinicTime } from "../../lib/clinic-time";
import { dentists } from "../../lib/dentists";
import { formatClockTime } from "../../lib/site";
import { getTimeSlots, treatments } from "../umow-wizyte/booking-schedule";
import type { ReceptionAppointment } from "./reception-calendar";

type DentistId = keyof typeof dentists;

export type AppointmentEditor =
  | { type: "create"; dentistId: DentistId; date: string; start: number; requestId: string }
  | { type: "edit"; appointment: ReceptionAppointment };

export function AppointmentDialog({ editor, now, onClose, onSaved, onRefresh, onSessionExpired }: {
  editor: AppointmentEditor;
  now: ClinicTime;
  onClose: () => void;
  onSaved: (notice: string, day?: number) => void;
  onRefresh: () => void;
  onSessionExpired: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const isCreate = editor.type === "create";
  const appointment = isCreate ? null : editor.appointment;
  const dentistId = isCreate ? editor.dentistId : editor.appointment.dentistId;
  const [date, setDate] = useState(isCreate ? editor.date : editor.appointment.date);
  const [start, setStart] = useState(isCreate ? editor.start : editor.appointment.start);
  const [treatmentId, setTreatmentId] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const day = parseBookingDate(date);
  const choices = treatments.filter((treatment) => treatment.dentistIds.includes(dentistId) &&
    day !== null && getTimeSlots(day, treatment.duration, now).includes(start));
  const selectedTreatment = choices.find((treatment) => treatment.id === treatmentId);
  const moveSlots = appointment && day !== null
    ? getTimeSlots(day, appointment.end - appointment.start, now)
    : [];
  const hasNewTime = appointment && moveSlots.includes(start) && (date !== appointment.date || start !== appointment.start);

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const form = new FormData(event.currentTarget);
    const body = isCreate
      ? { requestId: editor.requestId, date, start, dentistId, treatmentId,
          name: form.get("name"), email: form.get("email"), phone: form.get("phone") }
      : { id: editor.appointment.id, revision: editor.appointment.revision,
          action: confirmCancel ? "cancel" : "move", date, start };
    setPending(true);
    setError("");

    try {
      const response = await fetch("/api/reception/appointments", {
        method: isCreate ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (response.status === 401) return onSessionExpired();
      if (response.ok) {
        if (isCreate) return onSaved("Dodano wizytę.");
        if (confirmCancel) return onSaved("Odwołano wizytę.");
        return onSaved("Przeniesiono wizytę.", day ?? undefined);
      }
      if (response.status === 409) onRefresh();
      const result = await response.json().catch(() => null);
      setError(result?.message ?? "Nie udało się zapisać wizyty.");
    } catch {
      setError("Nie udało się zapisać wizyty. Spróbuj ponownie.");
    } finally {
      setPending(false);
    }
  }

  function changeDate(nextDate: string) {
    const nextDay = parseBookingDate(nextDate);
    setDate(nextDate);
    if (!appointment || nextDay === null) return;
    const slots = getTimeSlots(nextDay, appointment.end - appointment.start, getClinicTime(Date.now()));
    if (!slots.includes(start)) setStart(slots[0] ?? -1);
  }

  return (
    <dialog
      ref={dialog}
      className="reception-dialog"
      aria-labelledby="reception-dialog-title"
      onCancel={(event) => { event.preventDefault(); if (!pending) onClose(); }}
    >
      <div className="reception-dialog-heading">
        <div>
          <h2 id="reception-dialog-title">
            {isCreate ? "Dodaj wizytę" : confirmCancel ? "Odwołać wizytę?" : appointment?.treatment}
          </h2>
          <p>{dentists[dentistId].name} · {isCreate ? editor.date : appointment?.date} · {formatClockTime(isCreate ? editor.start : editor.appointment.start)}</p>
        </div>
        <button type="button" aria-label="Zamknij" onClick={onClose} disabled={pending}><X size={19} /></button>
      </div>
      <form onSubmit={submit}>
        <fieldset disabled={pending}>
          {isCreate ? (
            <>
              <label>Zabieg
                <select required value={treatmentId} onChange={(event) => setTreatmentId(event.target.value)}>
                  <option value="">Wybierz rodzaj wizyty</option>
                  {choices.map(({ id, name, duration }) => <option key={id} value={id}>{name} · {duration} min</option>)}
                </select>
              </label>
              {selectedTreatment ? <p>Do {formatClockTime(start + selectedTreatment.duration)} · {selectedTreatment.duration} min</p> : null}
              <label>Imię i nazwisko <input name="name" autoComplete="off" required minLength={2} maxLength={120} /></label>
              <label>Telefon <input name="phone" type="tel" autoComplete="off" required maxLength={30} /></label>
              <label>E-mail <input name="email" type="email" autoComplete="off" required maxLength={254} /></label>
            </>
          ) : (
            <>
              <dl className="reception-patient">
                <dt>Pacjent</dt><dd>{appointment?.patientName}</dd>
                <dt>Telefon</dt><dd>{appointment?.phone}</dd>
                <dt>E-mail</dt><dd>{appointment?.email}</dd>
                <dt>Czas trwania</dt><dd>{editor.appointment.end - editor.appointment.start} min</dd>
              </dl>
              {confirmCancel ? (
                <p>Termin zostanie zwolniony w grafiku i w rezerwacjach online.</p>
              ) : (
                <div className="reception-move-fields">
                  <label>Nowa data
                    <input type="date" required min={formatBookingDate(now.day)} value={date} onChange={(event) => changeDate(event.target.value)} />
                  </label>
                  <label>Nowa godzina
                    <select required value={moveSlots.includes(start) ? start : ""} onChange={(event) => setStart(Number(event.target.value))}>
                      <option value="">Wybierz godzinę</option>
                      {moveSlots.map((minute) => <option value={minute} key={minute}>{formatClockTime(minute)}</option>)}
                    </select>
                  </label>
                </div>
              )}
            </>
          )}
        </fieldset>
        {error ? <p className="reception-error" role="alert">{error}</p> : null}
        <div className="reception-dialog-actions">
          {!isCreate ? (
            <button type="button" className="button reception-cancel" disabled={pending} onClick={() => { setConfirmCancel(!confirmCancel); setError(""); }}>
              {confirmCancel ? "Wróć" : "Odwołaj wizytę"}
            </button>
          ) : null}
          <button className={confirmCancel ? "button reception-danger" : "button button-primary"} disabled={pending || (isCreate ? !selectedTreatment : !confirmCancel && !hasNewTime)} type="submit">
            {pending ? "Zapisywanie…" : isCreate ? "Zapisz wizytę" : confirmCancel ? "Potwierdź odwołanie" : "Przenieś wizytę"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
