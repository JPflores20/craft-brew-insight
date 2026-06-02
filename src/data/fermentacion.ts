export interface FermentPoint {
  dia: number;
  extracto: number;
  temperatura: number;
  fase: "Fermentación" | "Diacetilo" | "Maduración";
}

export function getCurva(tanque: string): FermentPoint[] {
  const seed = tanque.charCodeAt(tanque.length - 1) + tanque.charCodeAt(tanque.length - 2);
  const noise = (i: number) => (Math.sin(seed + i * 1.3) * 0.3);
  return Array.from({ length: 15 }, (_, idx) => {
    const dia = idx + 1;
    // sigmoide descendente 15 -> 2.5
    const t = (dia - 1) / 14;
    const extracto = +(2.5 + (12.5) * (1 - 1 / (1 + Math.exp(-6 * (t - 0.45))))).toFixed(2);
    let temperatura: number;
    let fase: FermentPoint["fase"];
    if (dia <= 9) {
      temperatura = +(13 + noise(dia)).toFixed(1);
      fase = "Fermentación";
    } else if (dia <= 11) {
      temperatura = +(14.5 + noise(dia) * 0.4).toFixed(1);
      fase = "Diacetilo";
    } else {
      // caída a -1
      const drop = (dia - 11) / 4;
      temperatura = +(14 - drop * 15).toFixed(1);
      fase = "Maduración";
    }
    return { dia, extracto, temperatura, fase };
  });
}