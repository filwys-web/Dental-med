import type { Metadata } from "next";
import { PageIntro } from "../../components/page-intro";
import { prices } from "../../lib/site";

export const metadata: Metadata = {
  title: prices.label,
  description: "Ceny konsultacji, diagnostyki, higienizacji i zabiegów stomatologicznych w Dental Med.",
};

const categories = [
  {
    id: "konsultacje",
    title: "Konsultacje i diagnostyka",
    services: [
      ["Konsultacja stomatologiczna z planem leczenia", "180"],
      ["Wizyta kontrolna", "150"],
      ["Zdjęcie punktowe RTG", "60"],
      ["Zdjęcie panoramiczne", "130"],
    ],
  },
  {
    id: "profilaktyka",
    title: "Profilaktyka i higienizacja",
    services: [
      ["Skaling (usuwanie kamienia)", "210"],
      ["Piaskowanie zębów", "190"],
      ["Pełna higienizacja (skaling, piaskowanie i fluoryzacja)", "360"],
      ["Fluoryzacja obu łuków", "150"],
    ],
  },
  {
    id: "wypelnienia",
    title: "Stomatologia zachowawcza",
    services: [
      ["Wypełnienie kompozytowe", "320–490"],
      ["Wypełnienie tymczasowe", "130"],
      ["Odbudowa zęba kompozytem", "od 550"],
    ],
  },
  {
    id: "endodoncja",
    title: "Leczenie kanałowe",
    services: [
      ["Ząb z jednym kanałem", "od 850"],
      ["Ząb z dwoma kanałami", "od 1 100"],
      ["Ząb z trzema lub czterema kanałami", "od 1 450"],
      ["Powtórne leczenie kanałowe", "od 1 150"],
    ],
    note: "Podane ceny leczenia kanałowego dotyczą opracowania i wypełnienia kanałów. Odbudowa zęba jest wyceniana osobno.",
  },
  {
    id: "chirurgia",
    title: "Chirurgia stomatologiczna",
    services: [
      ["Usunięcie zęba stałego", "od 350"],
      ["Chirurgiczne usunięcie ósemki", "od 750"],
      ["Usunięcie zęba mlecznego", "od 220"],
    ],
  },
  {
    id: "dzieci",
    title: "Stomatologia dziecięca",
    services: [
      ["Wizyta adaptacyjna", "160"],
      ["Wypełnienie w zębie mlecznym", "260–350"],
      ["Lakowanie bruzd (jeden ząb)", "140"],
    ],
  },
  {
    id: "protetyka",
    title: "Protetyka i implanty",
    services: [
      ["Konsultacja protetyczna", "240"],
      ["Korona pełnoceramiczna", "od 1 900"],
      ["Most pełnoceramiczny (jeden punkt)", "od 1 850"],
      ["Wszczepienie implantu", "od 3 400"],
      ["Korona na implancie z łącznikiem", "od 2 700"],
    ],
  },
  {
    id: "estetyka",
    title: "Stomatologia estetyczna",
    services: [
      ["Wybielanie nakładkowe obu łuków", "1 100"],
      ["Wybielanie gabinetowe obu łuków", "1 550"],
      ["Bonding (jeden ząb)", "od 650"],
    ],
  },
] as const;

export default function PricePage() {
  return (
    <main id="tresc" className="content-page shell">
      <PageIntro
        title={prices.label}
        description="Sprawdź orientacyjne ceny zabiegów. Dokładny koszt leczenia ustalamy po badaniu i omawiamy z Tobą przed rozpoczęciem zabiegu."
      />

      <nav className="price-index" aria-label="Kategorie cennika">
        <ul>
          {categories.map(({ id, title }) => (
            <li key={id}><a href={`#${id}`}>{title}</a></li>
          ))}
        </ul>
      </nav>

      <div className="price-grid">
        {categories.map((category) => (
          <section key={category.id} id={category.id} className="price-card" aria-labelledby={`cena-${category.id}`}>
            <h2 id={`cena-${category.id}`}>{category.title}</h2>
            <table aria-labelledby={`cena-${category.id}`}>
              <thead>
                <tr><th scope="col">Usługa</th><th scope="col">Cena</th></tr>
              </thead>
              <tbody>
                {category.services.map(([service, price]) => (
                  <tr key={service}>
                    <th scope="row">{service}</th>
                    <td>{price} zł</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {"note" in category ? <p className="price-note">{category.note}</p> : null}
          </section>
        ))}
      </div>
    </main>
  );
}
