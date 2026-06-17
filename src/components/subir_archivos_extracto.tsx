import React, { useState, useCallback } from "react";
import { useOperacionesStore } from "@/store/useOperacionesStore";
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  ShieldCheck,
  Loader2,
  Database,
  Trash2,
  CalendarDays,
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  guardarExtractosEnFirestore,
} from "@/lib/api/extractosFirebaseService";
import {
  obtenerPeriodo,
  type UploadProgress,
} from "@/lib/api/purgasFirebaseService";
import type { ExtractoRow, MarcaCerveza } from "@/types/proceso";

const COLUMNAS_REQUERIDAS = new Set([
  "MARCA",
  "FERMENTADOR",
  "FECHA_FIN_DE_LLENADO",
  "PLATO_24_HRS",
  "PLATO_48_HRS",
  "PLATO_72_HRS",
  "PLATO_96_HRS",
  "PLATO_120_HRS",
  "PLATO_144_HRS",
]);

import { BRANDS } from "@/data/brands";

function normalizarLlave(raw: string): string {
  return raw
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, "_");
}

function parsearFechaExcel(valor: any): Date | null {
  if (valor == null || valor === "") return null;

  const str = String(valor).trim();

  if (!isNaN(Number(str)) && Number(str) > 30000) {
    const utcDate = new Date((Number(str) - 25569) * 86400 * 1000);
    return new Date(utcDate.getTime() + Math.abs(utcDate.getTimezoneOffset()) * 60000);
  }

  if (str.includes("/")) {
    const parts = str.split(" ");
    const fechaPart = parts[0];
    const horaPart = parts[1];
    
    const isPM = str.toLowerCase().includes("pm");
    const isAM = str.toLowerCase().includes("am");

    const partes = fechaPart.split("/");
    const d = Number(partes[0]);
    const m = Number(partes[1]) - 1;
    let y = Number(partes[2]);
    if (y < 100) y += 2000;

    const fecha = new Date(y, m, d);

    if (horaPart) {
      let [hh, mm] = horaPart.split(":").map(Number);
      if (isPM && hh < 12) hh += 12;
      if (isAM && hh === 12) hh = 0;
      
      if (!isNaN(hh)) fecha.setHours(hh);
      if (!isNaN(mm)) fecha.setMinutes(mm);
    }

    return isNaN(fecha.getTime()) ? null : fecha;
  }

  if (str.includes("-")) {
    const [fechaPart, horaPart] = str.split(" ");
    const partes = fechaPart.split("-");
    let fecha: Date;

    if (partes[0].length === 4) {
      fecha = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
    } else {
      let y = Number(partes[2]);
      if (y < 100) y += 2000;
      fecha = new Date(y, Number(partes[1]) - 1, Number(partes[0]));
    }

    if (horaPart) {
      const [hh, mm] = horaPart.split(":").map(Number);
      if (!isNaN(hh)) fecha.setHours(hh);
      if (!isNaN(mm)) fecha.setMinutes(mm);
    }

    return isNaN(fecha.getTime()) ? null : fecha;
  }

  const intentoNativo = new Date(str);
  return isNaN(intentoNativo.getTime()) ? null : intentoNativo;
}

interface ResultadoLimpieza {
  filas: ExtractoRow[];
  totalOriginal: number;
  descartadas: number;
  columnasDescartadas: string[];
  periodo: string;
}

function limpiarYMapear(filasJson: any[]): ResultadoLimpieza {
  const totalOriginal = filasJson.length;
  let descartadas = 0;
  const columnasDescartadasSet = new Set<string>();
  let periodoDetectado: string | null = null;

  if (filasJson.length > 0) {
    Object.keys(filasJson[0]).forEach((k) => {
      const normalizada = normalizarLlave(k);
      if (!COLUMNAS_REQUERIDAS.has(normalizada)) {
        columnasDescartadasSet.add(k);
      }
    });
  }

  const filasLimpias: ExtractoRow[] = [];

  for (let idx = 0; idx < filasJson.length; idx++) {
    const filaOriginal = filasJson[idx];

    const fila: Record<string, any> = {};
    Object.keys(filaOriginal).forEach((llave) => {
      const normalizada = normalizarLlave(llave);
      if (COLUMNAS_REQUERIDAS.has(normalizada)) {
        fila[normalizada] = filaOriginal[llave];
      } else {
        // Mapeo flexible para columnas que puedan llamarse "24 HRS", "CHEQUEO 24 HRS", etc.
        if (normalizada.includes("24") && normalizada.includes("HRS")) fila["PLATO_24_HRS"] = filaOriginal[llave];
        else if (normalizada.includes("48") && normalizada.includes("HRS")) fila["PLATO_48_HRS"] = filaOriginal[llave];
        else if (normalizada.includes("72") && normalizada.includes("HRS")) fila["PLATO_72_HRS"] = filaOriginal[llave];
        else if (normalizada.includes("96") && normalizada.includes("HRS")) fila["PLATO_96_HRS"] = filaOriginal[llave];
        else if (normalizada.includes("120") && normalizada.includes("HRS")) fila["PLATO_120_HRS"] = filaOriginal[llave];
        else if (normalizada.includes("144") && normalizada.includes("HRS")) fila["PLATO_144_HRS"] = filaOriginal[llave];
      }
    });

    if (!fila.FERMENTADOR && !fila.TANQUE && String(filaOriginal.FERMENTADOR || filaOriginal.TANQUE || "").trim() === "") {
      descartadas++;
      continue;
    }
    const fermentadorVal = fila.FERMENTADOR || fila.TANQUE || filaOriginal.FERMENTADOR || filaOriginal.TANQUE;

    const fechaParsed = parsearFechaExcel(fila.FECHA_FIN_DE_LLENADO || filaOriginal["FECHA FIN DE LLENADO"] || filaOriginal.FECHA_LLENADO);
    
    // Si no hay fecha de llenado válida, o el año es absurdo (ej. 1900, 2001 por error de Excel), ignoramos la fila
    if (!fechaParsed || fechaParsed.getFullYear() < 2020) {
      descartadas++;
      continue;
    }

    const fechaLlenado = fechaParsed.toISOString();

    if (!periodoDetectado && fechaParsed) {
      periodoDetectado = obtenerPeriodo(fechaParsed);
    }

    const marcaRaw = String(fila.MARCA || "").trim();
    const marcaEncontrada = BRANDS.find(b => b.toLowerCase() === marcaRaw.toLowerCase());
    const marca: MarcaCerveza = marcaEncontrada || "Modelo Especial";

    const parseHora = (col: string, horasSumar: number) => {
      // 1. Si viene en el Excel de forma explícita, lo tomamos
      const v = parsearFechaExcel(fila[col]);
      if (v) return v.toISOString();
      if (fila[col]) return String(fila[col]);
      
      // 2. Si no viene, lo calculamos automáticamente sumando las horas a la fecha de llenado
      const fechaCalculada = new Date(fechaParsed.getTime() + horasSumar * 60 * 60 * 1000);
      return fechaCalculada.toISOString();
    };

    filasLimpias.push({
      id: `ext-${String(fermentadorVal).trim()}-${fechaParsed.getTime()}`,
      tanque: String(fermentadorVal).trim(),
      marca,
      fechaLlenado,
      h24: parseHora("PLATO_24_HRS", 24),
      h48: parseHora("PLATO_48_HRS", 48),
      h72: parseHora("PLATO_72_HRS", 72),
      h96: parseHora("PLATO_96_HRS", 96),
      h120: parseHora("PLATO_120_HRS", 120),
      h144: parseHora("PLATO_144_HRS", 144),
      estado: "En Rango",
    });
  }

  return {
    filas: filasLimpias,
    totalOriginal,
    descartadas,
    columnasDescartadas: Array.from(columnasDescartadasSet),
    periodo: periodoDetectado || obtenerPeriodo(),
  };
}

export function UploadExtractos() {
  const cargarExtractosDesdeArchivo = useOperacionesStore((s) => s.cargarExtractosDesdeArchivo);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<{ tipo: "exito" | "error" | "leyendo"; mensaje: string } | null>(null);
  const [progreso, setProgreso] = useState<UploadProgress | null>(null);
  const [resumenLimpieza, setResumenLimpieza] = useState<{
    totalOriginal: number;
    conservadas: number;
    descartadas: number;
    columnasDescartadas: string[];
    periodo: string;
  } | null>(null);

  const procesarArchivo = useCallback(
    async (file: File) => {
      setStatus({ tipo: "leyendo", mensaje: "Leyendo archivo xlsx..." });
      setProgreso(null);
      setResumenLimpieza(null);

      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          setStatus({ tipo: "leyendo", mensaje: "Procesando y limpiando datos..." });

          // Usamos header: 1 para obtener una matriz (array de arrays) y encontrar la fila de encabezados
          const aoa = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          let headerRowIndex = -1;
          for (let i = 0; i < aoa.length; i++) {
            const row = aoa[i];
            if (row && row.some(cell => String(cell).toUpperCase().trim() === "FERMENTADOR")) {
              headerRowIndex = i;
              break;
            }
          }

          if (headerRowIndex === -1) {
            throw new Error("No se encontró la columna 'FERMENTADOR' en el archivo.");
          }

          // Ahora leemos usando la fila encontrada como encabezado
          const filasJson = XLSX.utils.sheet_to_json(worksheet, { 
            defval: "", 
            range: headerRowIndex 
          }) as any[];

          if (!filasJson || filasJson.length === 0) {
            throw new Error("El archivo no tiene datos debajo de los encabezados.");
          }

          const resultado = limpiarYMapear(filasJson);

          if (resultado.filas.length === 0) {
            throw new Error(
              "No se encontraron filas válidas. Revisa que exista la columna 'FERMENTADOR' con datos."
            );
          }

          setResumenLimpieza({
            totalOriginal: resultado.totalOriginal,
            conservadas: resultado.filas.length,
            descartadas: resultado.descartadas,
            columnasDescartadas: resultado.columnasDescartadas,
            periodo: resultado.periodo,
          });

          cargarExtractosDesdeArchivo(resultado.filas as any[]);

          setStatus({ tipo: "leyendo", mensaje: "Guardando en base de datos..." });

          const res = await guardarExtractosEnFirestore(
            resultado.filas,
            resultado.periodo,
            (p) => setProgreso(p)
          );

          if (res.exito) {
            setStatus({
              tipo: "exito",
              mensaje: `✅ ${resultado.filas.length.toLocaleString()} registros guardados en periodo ${resultado.periodo}. Se descartaron ${resultado.descartadas.toLocaleString()} filas vacías y ${resultado.columnasDescartadas.length} columnas innecesarias.`,
            });
          } else {
            throw new Error(res.mensaje);
          }
        } catch (error: any) {
          setStatus({
            tipo: "error",
            mensaje: error.message || "Error al procesar el archivo.",
          });
        }
      };

      reader.onerror = () => {
        setStatus({ tipo: "error", mensaje: "Error físico al abrir el archivo." });
      };

      reader.readAsBinaryString(file);
    },
    [cargarExtractosDesdeArchivo]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) procesarArchivo(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) procesarArchivo(file);
    e.target.value = "";
  };

  const pct = progreso?.porcentaje ?? 0;
  const isLoading = status?.tipo === "leyendo";

  return (
    <div className="w-full max-w-sm space-y-2">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border border-dashed rounded-xl px-3 py-1.5 transition-all cursor-pointer flex items-center justify-center gap-2 ${
          isDragging
            ? "border-emerald-500 bg-emerald-500/5 scale-[1.02]"
            : isLoading
              ? "border-blue-500/40 bg-blue-500/5 pointer-events-none"
              : "border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 hover:shadow-sm bg-white"
        }`}
        onClick={() => {
          if (!isLoading) document.getElementById("file-upload-extracto")?.click();
        }}
      >
        <input
          id="file-upload-extracto"
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFileChange}
        />

        {isLoading ? (
          <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
        ) : (
          <Upload className="h-4 w-4 text-emerald-600" />
        )}

        <span className="font-bold text-sm text-slate-700 whitespace-nowrap">
          {isLoading ? "Procesando..." : "Importar Excel"}
        </span>
      </div>

      {progreso && progreso.fase !== "completado" && progreso.fase !== "error" && (
        <div className="space-y-1.5 px-1">
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <Database className="h-3 w-3" />
              {progreso.mensaje}
            </span>
            <span className="font-mono">{pct}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {resumenLimpieza && status?.tipo === "exito" && (
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-2 text-center">
            <p className="text-sm font-black text-slate-700">{resumenLimpieza.totalOriginal}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Filas</p>
          </div>
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-2 text-center">
            <p className="text-sm font-black text-emerald-600">{resumenLimpieza.conservadas}</p>
            <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider mt-0.5">Éxito</p>
          </div>
          <div className="rounded-lg border border-red-100 bg-red-50 p-2 text-center">
            <p className="text-sm font-black text-red-500">{resumenLimpieza.descartadas}</p>
            <p className="text-[9px] font-bold text-red-400 uppercase tracking-wider mt-0.5">Desc.</p>
          </div>
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-2 text-center">
            <p className="text-sm font-black text-blue-600">{resumenLimpieza.periodo.split("-")[1]}</p>
            <p className="text-[9px] font-bold text-blue-500 uppercase tracking-wider mt-0.5">Mes</p>
          </div>
        </div>
      )}

      {status && (
        <div
          className={`flex items-start gap-2 p-2 text-xs rounded-lg border transition-all shadow-sm ${
            status.tipo === "exito"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : status.tipo === "error"
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-blue-50 border-blue-200 text-blue-700"
          }`}
        >
          {status.tipo === "exito" ? (
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
          ) : status.tipo === "error" ? (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          ) : (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-500" />
          )}
          <span className="font-semibold leading-snug">{status.mensaje}</span>
        </div>
      )}
    </div>
  );
}
