export const clinic = {
  name: "Dental Med",
  city: "Wrocław",
  description:
    "Od 15 lat dbamy o zdrowie zębów dzieci i dorosłych. W Dental Med tłumaczymy każdy etap leczenia i wspólnie ustalamy jego plan.",
};

export const firstVisit = { slug: "pierwsza-wizyta", label: "Pierwsza wizyta" } as const;
export const booking = { slug: "umow-wizyte", label: "Umów wizytę" } as const;

export const sections = [
  { slug: "nasz-zespol", label: "Nasz zespół" },
  { slug: "cennik", label: "Cennik" },
  { slug: "kontakt", label: "Kontakt" },
  firstVisit,
  booking,
] as const;
