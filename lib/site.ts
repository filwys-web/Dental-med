export const clinic = {
  name: "Dental Med",
  city: "Wrocław",
  description:
    "Od 15 lat dbamy o zdrowie zębów dzieci i dorosłych. W Dental Med tłumaczymy każdy etap leczenia i wspólnie ustalamy jego plan.",
  contact: {
    phone: "+48 71 000 00 00",
    email: "recepcja@dental-med.example",
    hours: "Poniedziałek–piątek, 8:00–19:00",
  },
};

export const team = { slug: "nasz-zespol", label: "Nasz zespół" } as const;
export const prices = { slug: "cennik", label: "Cennik" } as const;
export const contact = { slug: "kontakt", label: "Kontakt" } as const;
export const firstVisit = { slug: "pierwsza-wizyta", label: "Pierwsza wizyta" } as const;
export const booking = { slug: "umow-wizyte", label: "Umów wizytę" } as const;

export const sections = [team, prices, contact, firstVisit, booking];
