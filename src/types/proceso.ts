export type MarcaCerveza =
  | "Corona"
  | "Corona Light E"
  | "Corona E"
  | "Corona Light Shine"
  | "Corona Golden Light"
  | "Chocolate Negra"
  | "Negra Modelo"
  | "Limon y Sal"
  | "Modelo Pura Malta"
  | "Modelo E"
  | "Michelob Ultra"
  | "Bud Light"
  | "Bud Light Chelada"
  | "Pacifico"
  | "Pacifico Suave"
  | "Pacifico Light"
  | "Pacifico E"
  | "Barrilito"
  | "Flying Fish"
  | "Estrella"
  | "Estrella E"
  | "Victoria"
  | "Modelo Especial"
  | "Busch"
  | "Budweiser";


export type EventType = "Turno1" | "Turno2" | "Turno3";

export interface AgendaEvent {
  id: string;
  titulo: string;
  inicio: string; // ISO date
  fin: string;
  tipo: EventType;
  descripcion?: string;
  turno?: string;
  completado?: boolean;
  extractoId?: string;
}

export type ExtractoEstado = "En Rango" | "En Observación" | "Desviado";

export interface ExtractoRow {
  id: string;
  marca: MarcaCerveza;
  tanque: string;
  fechaLlenado: string;
  h24: string | null;
  h48: string | null;
  h72: string | null;
  h96: string | null;
  h120: string | null;
  h144: string | null;
  estado72h?: "Pendiente" | "Completado"; 
  estado24h?: "Pendiente" | "Completado";
  estado: ExtractoEstado;
}

export interface FermentPoint {
  dia: number;
  extracto: number;
  temperatura: number;
  fase: "Fermentación" | "Diacetilo" | "Maduración";
}

export interface PurgaEntry {
  fechaHora: string | null;
  tiempo: number | null;
  realiza: string | null;
}

export interface PurgaRow {
  id: string;
  tanque: string;
  fecha: string;
  marca: MarcaCerveza;
  fechaLlenado: string;
  horas: string;
  historicas: string;
  purgas: PurgaEntry[]; // length 8
}

export interface Plato72Row {
  id: string;
  marca: MarcaCerveza;
  tanque: string;
  fechaLlenado: string;
  fechaChequeo72h: string | null;
}
