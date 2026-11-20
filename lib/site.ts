export const clinicHours = {
  weekdays: [1, 2, 3, 4, 5],
  opensAt: 8 * 60,
  closesAt: 19 * 60,
};

export function formatClockTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = String(minutes % 60).padStart(2, "0");
  return `${hours}:${remainder}`;
}

export const clinic = {
  name: "Dental Med",
  city: "Wrocław",
  description:
    "Od 15 lat dbamy o zdrowie zębów dzieci i dorosłych. W Dental Med tłumaczymy każdy etap leczenia i wspólnie ustalamy jego plan.",
  contact: {
    phone: "+48 71 000 00 00",
    email: "recepcja@dental-med.example",
    hours: `Poniedziałek–piątek, ${formatClockTime(clinicHours.opensAt)}–${formatClockTime(clinicHours.closesAt)}`,
  },
};

export const team = { slug: "nasz-zespol", label: "Nasz zespół" } as const;
export const prices = { slug: "cennik", label: "Cennik" } as const;
export const contact = { slug: "kontakt", label: "Kontakt" } as const;
export const firstVisit = { slug: "pierwsza-wizyta", label: "Pierwsza wizyta" } as const;
export const booking = { slug: "umow-wizyte", label: "Umów wizytę" } as const;

export const sections = [team, prices, contact, firstVisit, booking];
