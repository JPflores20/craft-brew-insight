import { BRANDS, TANKS } from "./brands";

export type ExtractoEstado = "En Rango" | "En Observación" | "Desviado";

export interface ExtractoRow {
  id: string;
  marca: string;
  tanque: string;
  fechaLlenado: string;
  og: number;
  h24: number;
  h48: number;
  h72: number;
  estado: ExtractoEstado;
}

function calcEstado(og: number, h72: number): ExtractoEstado {
  const atenuacion = (og - h72) / og;
  if (atenuacion >= 0.55 && atenuacion <= 0.72) return "En Rango";
  if (atenuacion >= 0.48 && atenuacion < 0.55) return "En Observación";
  return "Desviado";
}

function rand(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export const extractoData: ExtractoRow[] = Array.from({ length: 30 }, (_, i) => {
  const og = 11 + rand(i + 1) * 4;
  const h24 = og - (1.5 + rand(i + 2) * 1.5);
  const h48 = h24 - (2 + rand(i + 3) * 1.8);
  const drift = rand(i + 4);
  const h72 = Math.max(2.2, h48 - (1.5 + drift * 2.5) + (drift > 0.85 ? 1.8 : 0));
  const tanque = TANKS[i % TANKS.length];
  const marca = BRANDS[i % BRANDS.length];
  const day = 1 + (i % 26);
  return {
    id: `ext-${i}`,
    marca,
    tanque,
    fechaLlenado: `2026-05-${String(day).padStart(2, "0")}`,
    og: +og.toFixed(2),
    h24: +h24.toFixed(2),
    h48: +h48.toFixed(2),
    h72: +h72.toFixed(2),
    estado: calcEstado(og, h72),
  };
});