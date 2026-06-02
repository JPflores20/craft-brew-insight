export const kpis = {
  fermentando: 45,
  fueraRango: 2,
  purgasHoy: 8,
  mantenimientos: 3,
};

export const alertasRecientes = [
  { id: 1, tanque: "TK-118", tipo: "Extracto desviado", hora: "08:42", severidad: "Alta" as const },
  { id: 2, tanque: "TK-124", tipo: "Temperatura alta", hora: "07:55", severidad: "Media" as const },
  { id: 3, tanque: "TK-103", tipo: "Purga vencida", hora: "06:30", severidad: "Media" as const },
  { id: 4, tanque: "TK-141", tipo: "CIP pendiente", hora: "05:10", severidad: "Baja" as const },
  { id: 5, tanque: "TK-109", tipo: "Diacetilo elevado", hora: "Ayer", severidad: "Alta" as const },
];

export const produccionSemanal = [
  { dia: "Lun", hl: 820 },
  { dia: "Mar", hl: 940 },
  { dia: "Mié", hl: 880 },
  { dia: "Jue", hl: 1020 },
  { dia: "Vie", hl: 1180 },
  { dia: "Sáb", hl: 760 },
  { dia: "Dom", hl: 420 },
];