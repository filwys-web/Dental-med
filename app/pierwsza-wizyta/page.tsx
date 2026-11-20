import { Check, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "../../components/page-intro";
import { firstVisit, prices } from "../../lib/site";

export const metadata: Metadata = {
  title: firstVisit.label,
  description: "Dowiedz się, co zabrać i jak wygląda pierwsza wizyta w Dental Med.",
};

const checklist = [
  "Dokument tożsamości do rejestracji.",
  "Lista przyjmowanych leków i informacje o alergiach.",
  "Dotychczasowe zdjęcia RTG lub opisy leczenia, jeśli je masz.",
  "Pytania i kwestie, które chcesz omówić z dentystą.",
];

const questions = [
  {
    question: "Ile trwa pierwsza wizyta?",
    answer: "Zarezerwuj około 30–45 minut na rozmowę, badanie i omówienie dalszych kroków.",
  },
  {
    question: "Czy przed wizytą trzeba wykonać zdjęcie RTG?",
    answer: "Jeśli masz dotychczasowe zdjęcia, przynieś je na wizytę. Podczas badania lekarz oceni, czy potrzebne jest nowe zdjęcie.",
  },
  {
    question: "Czy potrzebuję skierowania?",
    answer: "Na prywatną konsultację wystarczy umówiony termin.",
  },
  {
    question: "Jak wygląda pierwsza wizyta dziecka?",
    answer: "Dziecko przychodzi z rodzicem lub opiekunem prawnym. Zaczynamy od oswojenia z gabinetem, a potem lekarz ocenia zęby w tempie odpowiednim dla dziecka.",
  },
  {
    question: "Co zrobić, jeśli stresuję się wizytą?",
    answer: "Powiedz o tym na początku spotkania. Możesz poprosić o wyjaśnianie kolejnych czynności i ustalić z lekarzem sygnał do przerwy.",
  },
  {
    question: "Kiedy poznam koszt leczenia?",
    answer: "Po badaniu lekarz omówi zakres i koszt leczenia. Wcześniej możesz sprawdzić orientacyjne ceny w cenniku.",
    href: `/${prices.slug}`,
  },
];

export default function FirstVisitPage() {
  return (
    <main id="tresc" className="content-page shell">
      <PageIntro
        title={firstVisit.label}
        description="Dowiedz się, co zabrać na konsultację i jak wygląda pierwsze spotkanie z dentystą."
      />

      <div className="visit-grid">
        <section className="visit-overview" aria-labelledby="przebieg">
          <h2 id="przebieg">Jak wygląda spotkanie?</h2>
          <p>
            Przyjdź 10 minut wcześniej, żeby spokojnie wypełnić kartę pacjenta.
            Lekarz zapyta o powód wizyty, przyjmowane leki i dotychczasowe leczenie, a następnie zbada zęby i dziąsła.
            Na koniec omówicie wyniki badania oraz możliwe dalsze kroki.
          </p>
        </section>

        <section className="visit-checklist" aria-labelledby="co-zabrac">
          <h2 id="co-zabrac">Co warto zabrać?</h2>
          <ul>
            {checklist.map((item) => (
              <li key={item}><Check size={19} aria-hidden="true" /> {item}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="faq" aria-labelledby="faq-heading">
        <h2 id="faq-heading">Najczęstsze pytania</h2>
        <div className="faq-items">
          {questions.map(({ question, answer, href }) => (
            <details key={question}>
              <summary>{question}<Plus size={19} aria-hidden="true" /></summary>
              <div className="faq-answer">
                <p>{answer}</p>
                {href ? <Link className="first-visit-link" href={href}>Zobacz cennik</Link> : null}
              </div>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
