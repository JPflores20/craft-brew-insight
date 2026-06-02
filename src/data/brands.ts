export const BRANDS = [
  "Lager Premium",
  "IPA Dorada",
  "Pilsner Clásica",
  "Stout Imperial",
  "Weissbier",
  "Märzen",
  "Porter Negra",
  "Bock Especial",
] as const;

export const TANKS = Array.from({ length: 45 }, (_, i) => `TK-${101 + i}`);