"use client";

import { Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { contactLimits } from "../../lib/contact-form";

const statusMessages = {
  idle: "",
  sending: "Trwa wysyłanie wiadomości.",
  success: "Wiadomość została wysłana.",
  invalid: "Sprawdź, czy wszystkie pola są poprawnie uzupełnione.",
  error: "Nie udało się wysłać wiadomości. Spróbuj ponownie.",
};

export function ContactForm() {
  const [status, setStatus] = useState<keyof typeof statusMessages>("idle");
  const isSending = status === "sending";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSending) return;

    const form = event.currentTarget;
    const fields = Object.fromEntries(new FormData(form));
    setStatus("sending");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });

      if (response.status === 204) {
        form.reset();
        setStatus("success");
        return;
      }

      setStatus(response.status === 400 ? "invalid" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form className="contact-form" method="post" onSubmit={handleSubmit}>
      <div className="contact-form-row">
        <label>
          Imię i nazwisko
          <input
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Anna Nowak"
            maxLength={contactLimits.name}
            required
            readOnly={isSending}
          />
        </label>
        <label>
          E-mail
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="anna@przyklad.pl"
            maxLength={contactLimits.email}
            required
            readOnly={isSending}
          />
        </label>
      </div>
      <label>
        Temat
        <input
          name="subject"
          type="text"
          placeholder="W czym możemy pomóc?"
          maxLength={contactLimits.subject}
          required
          readOnly={isSending}
        />
      </label>
      <label>
        Wiadomość
        <textarea name="message" rows={4} maxLength={contactLimits.message} required readOnly={isSending} />
      </label>
      <div className="contact-form-actions">
        <button className="button button-primary" type="submit" disabled={isSending}>
          Wyślij wiadomość <Send size={17} aria-hidden="true" />
        </button>
        <p role="status">{statusMessages[status]}</p>
      </div>
    </form>
  );
}
