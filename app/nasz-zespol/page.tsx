import type { Metadata } from "next";
import Image from "next/image";
import { PageIntro } from "../../components/page-intro";
import { team } from "../../lib/site";
import alicja from "../../public/zdjecia/zespol/alicja-radecka.webp";
import marek from "../../public/zdjecia/zespol/marek-wysocki.webp";
import natalia from "../../public/zdjecia/zespol/natalia-sowinska.webp";
import tomasz from "../../public/zdjecia/zespol/tomasz-malinowski.webp";
import ewa from "../../public/zdjecia/zespol/ewa-domanska.webp";

export const metadata: Metadata = {
  title: team.label,
  description: "Poznaj pięcioro lekarzy dentystów z zespołu Dental Med.",
};

const dentists = [
  {
    name: "Alicja Radecka",
    area: "Stomatologia zachowawcza",
    bio: "Od 21 lat leczy ubytki i odbudowuje uszkodzone zęby.",
    portrait: alicja,
  },
  {
    name: "Marek Wysocki",
    area: "Endodoncja",
    bio: "Ma 17 lat doświadczenia w leczeniu kanałowym, w tym pod mikroskopem.",
    portrait: marek,
  },
  {
    name: "Natalia Sowińska",
    area: "Stomatologia dziecięca",
    bio: "Od 13 lat leczy dzieci i prowadzi wizyty adaptacyjne.",
    portrait: natalia,
  },
  {
    name: "Tomasz Malinowski",
    area: "Chirurgia stomatologiczna",
    bio: "Od 19 lat wykonuje zabiegi chirurgiczne, w tym usuwanie zębów zatrzymanych.",
    portrait: tomasz,
  },
  {
    name: "Ewa Domańska",
    area: "Protetyka i estetyka",
    bio: "Ma 11 lat doświadczenia w odbudowie uzębienia z użyciem koron i mostów.",
    portrait: ewa,
  },
];

export default function TeamPage() {
  return (
    <main id="tresc" className="content-page shell">
      <PageIntro
        title={team.label}
        description="Poznaj lekarzy, którzy zajmują się leczeniem zębów dzieci i dorosłych w Dental Med."
      />
      <ul className="team-grid" aria-label="Lekarze dentyści">
        {dentists.map(({ name, area, bio, portrait }) => (
          <li className="team-card" key={name}>
            <div className="team-portrait">
              <Image
                src={portrait}
                alt=""
                fill
                placeholder="blur"
                sizes="(max-width: 480px) calc(100vw - 32px), (max-width: 760px) 47vw, (max-width: 1170px) 32vw, 245px"
              />
            </div>
            <div className="team-card-content">
              <p className="team-area">{area}</p>
              <h2>{name}</h2>
              <p className="team-bio">{bio}</p>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
