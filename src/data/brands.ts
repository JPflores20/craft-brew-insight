import { MarcaCerveza } from "../types/proceso";

export const BRANDS: MarcaCerveza[] = [
  "Corona",
  "Corona Light E",
  "Corona E",
  "Corona Light Shine",
  "Corona Golden Light",
  "Chocolate Negra",
  "Limon y Sal",
  "Modelo Pura Malta",
  "Modelo E",
  "Michelob Ultra",
  "Bud Light",
  "Bud Light Chelada",
  "Pacifico",
  "Pacifico Suave",
  "Pacifico Light",
  "Pacifico E",
  "Barrilito",
  "Flying Fish",
  "Negra Modelo",
  "Estrella",
  "Estrella E",
  "Victoria",
  "Modelo Especial",
  "Busch",
  "Budweiser"
];

export const TANKS = Array.from({ length: 45 }, (_, i) => `TK-${101 + i}`);