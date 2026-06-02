import { BRANDS, TANKS } from "./brands";

export type AnalisisVisual = "Mala" | "Regular" | "Buena" | null;

export interface PurgaEntry {
  hora: string | null;
  analisis: AnalisisVisual;
}

export interface PurgaRow {
  id: string;
  tanque: string;
  marca: string;
  fechaLlenado: string;
  horasReposo: number;
  purgas: PurgaEntry[]; // length 10
}

const opciones: AnalisisVisual[] = ["Mala", "Regular", "Buena"];

function r(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export const purgasInitial: PurgaRow[] = Array.from({ length: 20 }, (_, i) => {
  const totalPurgas = 3 + Math.floor(r(i + 1) * 8);
  const purgas: PurgaEntry[] = Array.from({ length: 10 }, (_, j) => {
    if (j >= totalPurgas) return { hora: null, analisis: null };
    const h = 6 + j * 2;
    const idx = Math.floor(r(i * 13 + j) * 3);
    // primeras peores, últimas mejores
    const bias = j < 2 ? 0 : j < 5 ? 1 : 2;
    const finalIdx = Math.min(2, Math.max(0, Math.round((idx + bias) / 2)));
    return {
      hora: `${String(h).padStart(2, "0")}:${j % 2 === 0 ? "00" : "30"}`,
      analisis: opciones[finalIdx],
    };
  });
  return {
    id: `purga-${i}`,
    tanque: TANKS[i],
    marca: BRANDS[i % BRANDS.length],
    fechaLlenado: `2026-05-${String(1 + (i % 28)).padStart(2, "0")}`,
    horasReposo: 48 + Math.floor(r(i + 50) * 72),
    purgas,
  };
});