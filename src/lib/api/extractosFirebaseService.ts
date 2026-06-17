import {
  collection,
  doc,
  writeBatch,
  getDocs,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { firestore } from "../firebase";
import type { ExtractoRow } from "@/types/proceso";
import { obtenerPeriodo, type UploadProgress } from "./purgasFirebaseService";

const BATCH_SIZE = 500;
const COLECCION_EXTRACTOS = "extractos_historico";

export async function guardarExtractosEnFirestore(
  filas: ExtractoRow[],
  periodo: string,
  onProgress?: (p: UploadProgress) => void
): Promise<{ exito: boolean; total: number; mensaje: string }> {
  const total = filas.length;

  if (total === 0) {
    return { exito: false, total: 0, mensaje: "No hay filas para guardar." };
  }

  try {
    const periodoDocRef = doc(firestore, COLECCION_EXTRACTOS, periodo);
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
      if (idsExistentes.has(fila.id)) {
        omitidos++;
        continue;
      }

      const docRef = doc(registrosRef, fila.id);

      batchEscritura.set(docRef, {
        ...fila,
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

export async function obtenerExtractosPorPeriodo(
  periodo: string
): Promise<ExtractoRow[]> {
  const periodoDocRef = doc(firestore, COLECCION_EXTRACTOS, periodo);
  const registrosRef = collection(periodoDocRef, "registros");

  const snapshot = await getDocs(registrosRef);

  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      tanque: data.tanque ?? "",
      marca: data.marca ?? "",
      fechaLlenado: data.fechaLlenado ?? "",
      h24: data.h24 ?? null,
      h48: data.h48 ?? null,
      h72: data.h72 ?? null,
      h96: data.h96 ?? null,
      h120: data.h120 ?? null,
      h144: data.h144 ?? null,
      estado: data.estado ?? "En Rango",
      estado72h: data.estado72h ?? "En Rango",
    } as ExtractoRow;
  });
}

export async function obtenerTodosLosExtractos(): Promise<ExtractoRow[]> {
  const periodos = await listarPeriodosExtractos();
  const promesas = periodos.map(p => obtenerExtractosPorPeriodo(p.periodo));
  const resultados = await Promise.all(promesas);
  return resultados.flat();
}

export interface PeriodoResumenExtracto {
  periodo: string;
  totalRegistros: number;
  fechaSubida: Date;
}

export async function listarPeriodosExtractos(): Promise<PeriodoResumenExtracto[]> {
  const colRef = collection(firestore, COLECCION_EXTRACTOS);
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

export async function actualizarExtractoEnFirestore(
  periodo: string,
  id: string,
  data: Partial<ExtractoRow>
): Promise<void> {
  const docRef = doc(firestore, COLECCION_EXTRACTOS, periodo, "registros", id);
  await setDoc(docRef, { ...data, actualizadoEn: Timestamp.now() }, { merge: true });
}
