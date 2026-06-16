import { createFileRoute } from "@tanstack/react-router";
import { guardarExtractosEnFirestore } from "@/lib/api/extractosFirebaseService";
import { guardarPurgasEnFirestore, obtenerPeriodo } from "@/lib/api/purgasFirebaseService";
import type { ExtractoRow, PurgaRow, PurgaEntry, MarcaCerveza, ExtractoEstado } from "@/types/proceso";

// API Key fija de seguridad
const API_KEY_SECRETA = "brew-insight-secure-token-2026";

export const Route = createFileRoute("/api/ingesta")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          // 1. Validar la API Key de seguridad en los Headers
          const apiKey = request.headers.get("x-api-key");
          if (apiKey !== API_KEY_SECRETA) {
            return new Response(JSON.stringify({ error: "No autorizado" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          // 2. Extraer datos del body enviado
          const rawBody = await request.text();
          let payload;
          try {
            payload = JSON.parse(rawBody);
          } catch (err: any) {
            console.error("Error al parsear JSON:", err.message);
            console.error("Snippet del body:", rawBody.substring(0, 500));
            return new Response(JSON.stringify({ 
              error: `JSON inválido: ${err.message}`, 
              snippet: rawBody.substring(0, 200) 
            }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          console.log("📥 [API Ingesta Batch] Petición recibida. Tipo de datos:", Array.isArray(payload) ? `Array (${payload.length} items)` : typeof payload);
          console.log("🔍 Snippet del cuerpo:", rawBody.substring(0, 300));
          
          let rowsToProcess: any[] = [];
          if (Array.isArray(payload)) {
            rowsToProcess = payload;
          } else if (payload && typeof payload === "object") {
            rowsToProcess = [payload];
          }

          if (rowsToProcess.length === 0) {
            return new Response(JSON.stringify({ error: "Cuerpo de solicitud vacío o no es un array válido" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const { doc, setDoc, Timestamp, getDocs, collection, writeBatch } = await import("firebase/firestore");
          const { firestore } = await import("@/lib/firebase");

          // Helper de parsing robusto de fecha
          const parseFecha = (rawFecha: any) => {
            if (!rawFecha) return null;
            let fechaBase: Date;
            const strFecha = String(rawFecha).trim();
            const matchDmy = strFecha.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
            if (matchDmy) {
              let part1 = parseInt(matchDmy[1], 10);
              let part2 = parseInt(matchDmy[2], 10);
              const year = parseInt(matchDmy[3], 10);
              let hour = matchDmy[4] ? parseInt(matchDmy[4], 10) : 0;
              const minute = matchDmy[5] ? parseInt(matchDmy[5], 10) : 0;
              
              // Detectar AM/PM
              if (strFecha.toLowerCase().includes("pm") && hour < 12) hour += 12;
              if (strFecha.toLowerCase().includes("am") && hour === 12) hour = 0;

              let day = part1;
              let month = part2 - 1;
              // Si la segunda parte es > 12, entonces es formato MM/DD/YYYY
              if (part2 > 12) {
                day = part2;
                month = part1 - 1;
              }
              fechaBase = new Date(year, month, day, hour, minute);
            } else {
              fechaBase = new Date(strFecha);
            }
            return isNaN(fechaBase.getTime()) ? null : fechaBase;
          };

          const addHours = (d: Date, h: number) => new Date(d.getTime() + h * 60 * 60 * 1000).toISOString();

          // Agrupar filas mapeadas por periodo
          const filasPorPeriodo: Record<string, { extracto: ExtractoRow; purga: PurgaRow }[]> = {};

          for (let index = 0; index < rowsToProcess.length; index++) {
            const rawRow = rowsToProcess[index];
            let marca: any, tanque: any, rawFecha: any;
            let h24: any, h48: any, h72: any, h96: any, h120: any, h144: any;

            if (Array.isArray(rawRow)) {
              // Si es un Array de Arrays (formato ExcelData crudo de Power Automate)
              // Omitir cabeceras si la primera fila las contiene
              if (index === 0 && (String(rawRow[0]).toLowerCase() === "marca" || String(rawRow[1]).toLowerCase() === "tanque" || String(rawRow[1]).toLowerCase() === "fermentador")) {
                continue;
              }
              marca = rawRow[0] || rawRow[9];
              tanque = rawRow[1] || rawRow[10];
              rawFecha = rawRow[2] || rawRow[11];
              h24 = rawRow[3] || rawRow[12];
              h48 = rawRow[4] || rawRow[13];
              h72 = rawRow[5] || rawRow[14];
              h96 = rawRow[6] || rawRow[15];
              h120 = rawRow[7] || rawRow[16];
              h144 = rawRow[8] || rawRow[17];
            } else if (rawRow && typeof rawRow === "object") {
              // Si es un objeto JSON tradicional
              marca = String(rawRow.marca || rawRow.MARCA || rawRow.Column1 || "").trim();
              tanque = String(rawRow.tanque || rawRow.fermentador || rawRow.TANQUE || rawRow.FERMENTADOR || rawRow.Column2 || "").trim();
              rawFecha = rawRow.fechaFinLlenado || rawRow.fecha_llenado || rawRow["FECHA FIN DE LLENADO"] || rawRow.Column3;
              h24 = String(rawRow.h24 || rawRow.Column4 || "").trim();
              h48 = String(rawRow.h48 || rawRow.Column5 || "").trim();
              h72 = String(rawRow.h72 || rawRow.Column6 || "").trim();
              h96 = String(rawRow.h96 || rawRow.Column7 || "").trim();
              h120 = String(rawRow.h120 || rawRow.Column8 || "").trim();
              h144 = String(rawRow.h144 || rawRow.Column9 || "").trim();
            }

            if (!tanque || !marca || !rawFecha) {
              continue; // Saltar filas incompletas o inválidas
            }

            const fechaBase = parseFecha(rawFecha);
            if (!fechaBase || fechaBase.getFullYear() < 2000) continue;

            const periodo = obtenerPeriodo(fechaBase);
            const idUnico = `ext-${tanque}-${fechaBase.getTime()}`;

            const sanitizeDate = (val: string | undefined, hoursToAdd: number) => {
              if (!val || val.trim() === "") return addHours(fechaBase, hoursToAdd);
              if (val.includes("1900") || val.includes("1899")) return addHours(fechaBase, hoursToAdd);
              return String(val).trim();
            };

            const filaExtracto: ExtractoRow = {
              id: idUnico,
              tanque: String(tanque),
              marca: marca as MarcaCerveza,
              fechaLlenado: fechaBase.toISOString(),
              h24: sanitizeDate(h24, 24),
              h48: sanitizeDate(h48, 48),
              h72: sanitizeDate(h72, 72),
              h96: sanitizeDate(h96, 96),
              h120: sanitizeDate(h120, 120),
              h144: sanitizeDate(h144, 144),
              estado72h: "Pendiente",
              estado: "En Rango" as ExtractoEstado,
            };

            const purgasMapeadas: PurgaEntry[] = [];
            const eventosAgenda: any[] = [];
            const { obtenerTurnoPorHora } = await import("@/data/turno");

            for (let i = 1; i <= 8; i++) {
              const purgaDate = new Date(fechaBase.getTime() + i * 7.5 * 3600000);
              purgasMapeadas.push({
                fechaHora: purgaDate.toISOString(),
                tiempo: null,
                realiza: null,
              });
              
              eventosAgenda.push({
                id: `ev-auto-${tanque || fechaBase.getTime()}-p${i}`,
                titulo: `Purga ${i} - Tanque ${tanque || "S/N"}`,
                inicio: purgaDate.toISOString(),
                fin: new Date(purgaDate.getTime() + 30 * 60000).toISOString(),
                tipo: "Turno",
                descripcion: `Marca: ${marca}`,
                turno: obtenerTurnoPorHora(purgaDate),
              });
            }

            const fechaEvento72 = h72 ? parseFecha(h72) : new Date(fechaBase.getTime() + 72 * 3600000);
            if (fechaEvento72) {
              eventosAgenda.push({
                id: `ev-auto-ext-72-h72-${tanque || fechaBase.getTime()}`,
                titulo: `Chequeo Plato 72h - Tanque ${tanque || "S/N"}`,
                inicio: fechaEvento72.toISOString(),
                fin: new Date(fechaEvento72.getTime() + 30 * 60000).toISOString(),
                tipo: "Turno",
                descripcion: `Marca: ${marca}`,
                turno: obtenerTurnoPorHora(fechaEvento72),
              });
            }

            const filaPurga: PurgaRow = {
              id: `pr-${tanque}-${fechaBase.getTime()}`,
              tanque: String(tanque),
              fecha: fechaBase.toISOString(),
              marca: marca as MarcaCerveza,
              fechaLlenado: fechaBase.toISOString(),
              horas: "0",
              historicas: "0",
              purgas: purgasMapeadas,
            };

            if (!filasPorPeriodo[periodo]) {
              filasPorPeriodo[periodo] = [];
            }
            filasPorPeriodo[periodo].push({ extracto: filaExtracto, purga: filaPurga, eventosAgenda });
          }

          let totalNuevosGuardados = 0;

          // Procesar e insertar en Firestore por periodo para optimizar consultas de existencia
          for (const periodo of Object.keys(filasPorPeriodo)) {
            const items = filasPorPeriodo[periodo];
            
            // Obtener todos los IDs existentes de este periodo para omitir duplicados
            const extColRef = collection(firestore, "extractos_historico", periodo, "registros");
            const snapExt = await getDocs(extColRef);
            const idsExistentes = new Set(snapExt.docs.map(d => d.id));

            let batch = writeBatch(firestore);
            let registrosEnBatch = 0;

            for (const item of items) {
              if (!idsExistentes.has(item.extracto.id)) {
                // Guardar extracto
                const docExtRef = doc(firestore, "extractos_historico", periodo, "registros", item.extracto.id);
                batch.set(docExtRef, {
                  ...item.extracto,
                  creadoEn: Timestamp.now(),
                });

                // Guardar purga
                const docPurgaRef = doc(firestore, "purgas_historico", periodo, "registros", item.purga.id);
                batch.set(docPurgaRef, {
                  ...item.purga,
                  creadoEn: Timestamp.now(),
                });

                totalNuevosGuardados++;
                registrosEnBatch += 2;

                // Guardar eventos de agenda
                if (item.eventosAgenda) {
                  for (const evento of item.eventosAgenda) {
                    const docEventoRef = doc(firestore, "agenda_eventos", evento.id);
                    batch.set(docEventoRef, {
                      ...evento,
                      creadoEn: Timestamp.now(),
                    }, { merge: true });
                    registrosEnBatch++;
                  }
                }

                // Firestore limita cada batch a 500 operaciones
                if (registrosEnBatch >= 450) {
                  await batch.commit();
                  batch = writeBatch(firestore);
                  registrosEnBatch = 0;
                }
              }
            }

            if (registrosEnBatch > 0) {
              await batch.commit();
            }

            // Actualizar metadatos y conteo del periodo
            if (totalNuevosGuardados > 0) {
              const snapExtActualizado = await getDocs(extColRef);
              const totalExt = snapExtActualizado.size;

              const periodoExtRef = doc(firestore, "extractos_historico", periodo);
              await setDoc(periodoExtRef, {
                periodo,
                totalRegistros: totalExt,
                fechaSubida: Timestamp.now(),
                actualizadoEn: Timestamp.now(),
              }, { merge: true });

              const purgasColRef = collection(firestore, "purgas_historico", periodo, "registros");
              const snapPurgasActualizado = await getDocs(purgasColRef);
              const totalPurgas = snapPurgasActualizado.size;

              const periodoPurgasRef = doc(firestore, "purgas_historico", periodo);
              await setDoc(periodoPurgasRef, {
                periodo,
                totalRegistros: totalPurgas,
                fechaSubida: Timestamp.now(),
                actualizadoEn: Timestamp.now(),
              }, { merge: true });
            }
          }

          console.log(`🎉 [API Ingesta Batch] Completado con éxito. Nuevos registros insertados: ${totalNuevosGuardados}`);
          return new Response(JSON.stringify({ 
            exito: true, 
            mensaje: `Procesamiento completado. Se insertaron ${totalNuevosGuardados} filas nuevas sin duplicados.`,
            nuevos: totalNuevosGuardados 
          }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error: any) {
          console.error("Error en API Ingesta:", error);
          return new Response(JSON.stringify({ error: error.message || "Error interno del servidor" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
