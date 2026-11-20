# Dental Med

Serwis fikcyjnego gabinetu stomatologicznego. Projekt wykorzystuje Next.js (App Router), React i TypeScript. Zawiera stronę główną, zespół, cennik, kontakt i FAQ o pierwszej wizycie.

## Uruchomienie

Wymagany Node.js 22 lub nowszy.

```bash
npm ci
npm run dev
```

Strona lokalna działa pod adresem http://localhost:3000. Przed wdrożeniem uruchom `npm run lint`, `npm run typecheck` i `npm run build`.

## Formularz kontaktowy

Formularz na `/kontakt` wysyła wiadomości przez Gmail i Nodemailer. Ustaw poniższe zmienne w Vercel w **Settings → Environment Variables** albo w lokalnym pliku `.env.local`.

| Zmienna | Wartość |
| --- | --- |
| `GMAIL_USER` | Adres Gmail używany do wysyłki. |
| `GMAIL_APP_PASWORD` | [Hasło aplikacji Google](https://support.google.com/accounts/answer/185833) dla tego konta. Wymaga weryfikacji dwuetapowej. Nazwa zmiennej ma jedno `S` w `PASWORD`. |
| `CONTACT_TO` | Adres skrzynki, która odbiera wiadomości z formularza. |

Na Vercel zapisz zmienne dla wybranego środowiska i uruchom nowe wdrożenie. Wyślij wiadomość testową z `/kontakt` i sprawdź skrzynkę odbiorczą. Odpowiedź na otrzymaną wiadomość trafi na adres podany w formularzu.

## Rezerwacja wizyt

Strona `/umow-wizyte` korzysta z tabeli `appointments` w Supabase. Schemat i ograniczenie blokujące nakładające się wizyty tego samego lekarza są w `supabase/migrations/`. Zastosuj migrację w bazie przed uruchomieniem formularza.

Ustaw `SUPABASE_URL` (adres projektu) i `SUPABASE_SECRET_KEY` (klucz Secret projektu) w środowisku serwera. Lokalnie użyj `.env.local`, a na Vercelu ustaw klucz jako zmienną typu Secret. Endpoint dostępności przekazuje wyłącznie identyfikatory lekarzy i zajęte przedziały.

## Zdjęcia

Fotografie pochodzą z Pexels i są użyte zgodnie z [licencją Pexels](https://www.pexels.com/license/). Nazwiska i biogramy na stronie zespołu są fikcyjne. Zdjęcia są przechowywane w `public/zdjecia/` w formacie WebP.

- [Konsultacja stomatologiczna, Tima Miroshnichenko](https://www.pexels.com/photo/a-dentist-explaining-to-a-patient-using-a-dental-cast-5355723/)
- [Portret 5355860, Tima Miroshnichenko](https://www.pexels.com/photo/female-dentist-in-white-uniform-5355860/)
- [Portret 6812464, Pavel Danilyuk](https://www.pexels.com/photo/photo-of-a-dentist-holding-a-tool-6812464/)
- [Portret 31043310, Manuel Toledo](https://www.pexels.com/photo/confident-female-dentist-in-professional-attire-31043310/)
- [Portret 6627836, Kaboompics](https://www.pexels.com/photo/portrait-of-smiling-dentist-in-clinic-6627836/)
- [Portret 19963164, Tessy Agbonome](https://www.pexels.com/photo/portrait-of-smiling-doctor-19963164/)
