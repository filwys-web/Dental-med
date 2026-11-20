import { Clock, Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import { PageIntro } from "../../components/page-intro";
import { clinic, contact } from "../../lib/site";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: contact.label,
  description: "Numer telefonu, adres e-mail i godziny pracy recepcji Dental Med.",
};

const contactDetails = [
  { icon: Phone, label: "Telefon", text: clinic.contact.phone },
  { icon: Mail, label: "E-mail", text: clinic.contact.email },
  { icon: Clock, label: "Godziny pracy", text: clinic.contact.hours },
  { icon: MapPin, label: "Miasto", text: clinic.city },
];

export default function ContactPage() {
  return (
    <main id="tresc" className="content-page shell">
      <PageIntro
        title={contact.label}
        description="Dane recepcji gabinetu i godziny, w których przyjmujemy pacjentów."
      />

      <div className="contact-grid">
        <section className="contact-card" aria-labelledby="recepcja">
          <h2 id="recepcja">Recepcja Dental Med</h2>
          <address>
            <dl className="contact-details">
              {contactDetails.map(({ icon: Icon, label, text }) => (
                <div key={label} className="contact-detail">
                  <dt><Icon size={19} aria-hidden="true" /> {label}</dt>
                  <dd>{text}</dd>
                </div>
              ))}
            </dl>
          </address>
        </section>

        <section className="contact-card contact-form-card" aria-labelledby="wiadomosc">
          <h2 id="wiadomosc">Napisz do nas</h2>
          <ContactForm />
        </section>
      </div>
    </main>
  );
}
