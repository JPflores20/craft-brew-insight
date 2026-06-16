import {
  collection,
  doc,
  writeBatch,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { firestore } from "../firebase";
import type { PurgaRow } from "@/types/proceso";

// ─────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────

/** Firestore tiene un límite de 500 operaciones por batch */
const BATCH_SIZE = 500;

/** Nombre de la colección raíz en Firestore */
const COLECCION_PURGAS = "purgas_historico";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Genera un ID de periodo con formato "YYYY-MM" a partir de una fecha.
 * Ejemplo: "2026-06"
 */
export function obtenerPeriodo(fecha: Date = new Date()): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

// ─────────────────────────────────────────────────────────────
// Guardar purgas (batch write)
// ─────────────────────────────────────────────────────────────

export interface UploadProgress {
  total: number;
  escritos: number;
  porcentaje: number;
  fase: "limpiando" | "subiendo" | "completado" | "error";
  mensaje: string;
}

/**
 * Sube un arreglo de PurgaRow a Firestore dentro de la sub-colección
 * del periodo mensual correspondiente.
 *
 * Estructura en Firestore:
 *   purgas_historico/{periodo}/registros/{docId}
 *
 * Donde {periodo} = "2026-06", etc.
 *
 * @param filas     - Arreglo de PurgaRow ya limpias
 * @param periodo   - Clave de periodo "YYYY-MM"
 * @param onProgress - Callback opcional para reportar progreso
 */
export async function guardarPurgasEnFirestore(
  filas: PurgaRow[],
  periodo: string,
  onProgress?: (p: UploadProgress) => void
): Promise<{ exito: boolean; total: number; mensaje: string }> {
  const total = filas.length;

  if (total === 0) {
    return { exito: false, total: 0, mensaje: "No hay filas para guardar." };
  }

  try {
    const periodoDocRef = doc(firestore, COLECCION_PURGAS, periodo);
    const registrosRef = collection(periodoDocRef, "registros");

    onProgress?.({
      total,
      escritos: 0,
      porcentaje: 0,
      fase: "limpiando",
      mensaje: "Verificando registros existentes para evitar duplicados...",
    });

    const snapshotAnterior = await getDocs(registrosRef);
    const idsExistentes = new Set(snapshotAnterior.docs.map((d) => d.id));

    let escritos = 0;
    let omitidos = 0;
    const batchesEscribir: ReturnType<typeof writeBatch>[] = [];
    let batchEscritura = writeBatch(firestore);
    let registrosEnBatch = 0;

    for (let i = 0; i < total; i++) {
      const fila = filas[i];
      
      // Omitir si ya existe
      if (idsExistentes.has(fila.id)) {
        omitidos++;
        continue;
      }

      const docRef = doc(registrosRef, fila.id);

      batchEscritura.set(docRef, {
        ...fila,
        purgas: fila.purgas.map((p) => ({
          fechaHora: p.fechaHora ?? null,
          tiempo: p.tiempo ?? null,
          realiza: p.realiza ?? null,
        })),
        creadoEn: Timestamp.now(),
      });

      escritos++;
      registrosEnBatch++;

      if (registrosEnBatch === BATCH_SIZE) {
        batchesEscribir.push(batchEscritura);
        batchEscritura = writeBatch(firestore);
        registrosEnBatch = 0;
      }

      if (escritos % 50 === 0) {
        onProgress?.({
          total,
          escritos,
          porcentaje: Math.round(((i + 1) / total) * 100),
          fase: "subiendo",
          mensaje: `Guardando: ${escritos} nuevos, ${omitidos} omitidos (ya existían)...`,
        });
      }
    }

    if (registrosEnBatch > 0) {
      batchesEscribir.push(batchEscritura);
    }

    for (const b of batchesEscribir) {
      await b.commit();
    }

    const snapshotActualizado = await getDocs(registrosRef);
    const totalRegistrosActual = snapshotActualizado.size;

    await setDoc(
      periodoDocRef,
      {
        periodo,
        totalRegistros: totalRegistrosActual,
        fechaSubida: Timestamp.now(),
        actualizadoEn: Timestamp.now(),
      },
      { merge: true }
    );

    onProgress?.({
      total,
      escritos,
      porcentaje: 100,
      fase: "completado",
      mensaje: `¡Listo! Se agregaron ${escritos} registros nuevos. Se omitieron ${omitidos} duplicados.`,
    });

    return {
      exito: true,
      total: escritos,
      mensaje: `Se agregaron ${escritos} nuevos registros y se omitieron ${omitidos} duplicados en el periodo ${periodo}.`,
    };
  } catch (error: any) {
    onProgress?.({
      total,
      escritos: 0,
      porcentaje: 0,
      fase: "error",
      mensaje: error.message || "Error al escribir en Firestore.",
    });

    return {
      exito: false,
      total: 0,
      mensaje: error.message || "Error al escribir en Firestore.",
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Leer purgas de un periodo
// ─────────────────────────────────────────────────────────────

/**
 * Obtiene todas las purgas de un periodo mensual desde Firestore.
 */
export async function obtenerPurgasPorPeriodo(
  periodo: string
): Promise<PurgaRow[]> {
  const periodoDocRef = doc(firestore, COLECCION_PURGAS, periodo);
  const registrosRef = collection(periodoDocRef, "registros");
  const snapshot = await getDocs(registrosRef);

  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      tanque: data.tanque ?? "",
      fecha: data.fecha ?? "",
      marca: data.marca ?? "Modelo Especial",
      fechaLlenado: data.fechaLlenado ?? "",
      horas: data.horas ?? "0",
      historicas: data.historicas ?? "0",
      purgas: (data.purgas ?? []).map((p: any) => ({
        fechaHora: p.fechaHora ?? null,
        tiempo: p.tiempo ?? null,
        realiza: p.realiza ?? null,
      })),
    } as PurgaRow;
  });
}

// ─────────────────────────────────────────────────────────────
// Listar periodos disponibles
// ─────────────────────────────────────────────────────────────

export interface PeriodoResumen {
  periodo: string;
  totalRegistros: number;
  fechaSubida: Date;
}

/**
 * Obtiene la lista de todos los periodos mensuales que se han subido.
 */
export async function listarPeriodos(): Promise<PeriodoResumen[]> {
  const colRef = collection(firestore, COLECCION_PURGAS);
  const snapshot = await getDocs(colRef);

  return snapshot.docs
    .map((d) => {
      const data = d.data();
      return {
        periodo: d.id,
        totalRegistros: data.totalRegistros ?? 0,
        fechaSubida: data.fechaSubida?.toDate?.() ?? new Date(),
      };
    })
    .sort((a, b) => b.periodo.localeCompare(a.periodo));
}

export async function actualizarPurgaEnFirestore(
  periodo: string,
  id: string,
  data: Partial<PurgaRow>
): Promise<void> {
  const docRef = doc(firestore, COLECCION_PURGAS, periodo, "registros", id);
  await setDoc(docRef, { ...data, actualizadoEn: Timestamp.now() }, { merge: true });
}
