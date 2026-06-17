import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import type { ExtractoRow } from "@/types/proceso";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { useOperacionesStore } from "@/store/useOperacionesStore";
import { Cross } from "recharts";

interface Plato72TableProps {
  rows: ExtractoRow[];
}

function formatDate(isoString?: string | null) {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return format(d, "dd/MM HH:mm");
  } catch {
    return isoString;
  }
}

export function Checar72Table({ rows }: Plato72TableProps) {
  const toggleEstado72h = useOperacionesStore(s => s.toggleEstado72h);

  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader className="bg-slate-100/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10 shadow-sm">
          <TableRow className="border-b-0 hover:bg-transparent">
            <TableHead className="border-r border-slate-200 text-sm font-extrabold tracking-widest text-slate-700 py-4">Marca</TableHead>
            <TableHead className="border-r border-slate-200 text-sm font-extrabold tracking-widest text-slate-700 py-4 text-center">Tanque</TableHead>
            <TableHead className="border-r border-slate-200 text-sm font-extrabold tracking-widest text-slate-700 py-4 text-center">Fecha Llenado</TableHead>
            <TableHead className="border-r border-slate-200 text-sm font-extrabold tracking-widest text-slate-700 py-4 text-center">Fecha y Hora Chequeo 72 Hrs</TableHead>
            <TableHead className="text-sm font-extrabold tracking-widest text-slate-700 py-4 text-center">Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => {
            const isCompletado = r.estado72h === "Completado";
            return (
              <TableRow key={r.id} className={`hover:bg-amber-50/60 transition-colors border-b border-slate-100 group ${isCompletado ? "opacity-75 bg-slate-50/40 hover:bg-slate-50/60" : ""}`}>
                
                <TableCell className="border-r border-slate-100 whitespace-nowrap py-3">
                  <span className="inline-flex items-center rounded-lg bg-blue-100 px-3 py-1 text-sm font-black text-blue-800 border border-blue-200 shadow-sm">
                    {r.marca}
                  </span>
                </TableCell>
                <TableCell className={`border-r border-slate-100 font-black text-sm text-slate-900 text-center ${isCompletado ? "line-through opacity-50" : ""}`}>{r.tanque}</TableCell>
                <TableCell className="border-r border-slate-100 text-sm font-bold tracking-tight whitespace-nowrap text-slate-700 tabular-nums text-center">
                  {formatDate(r.fechaLlenado)}
                </TableCell>
                <TableCell className="border-r border-slate-100 text-sm font-medium tracking-tight whitespace-nowrap text-slate-500 tabular-nums text-center">
                  {formatDate(r.h72)}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <div className="flex justify-center">
                    <button
                      onClick={() => !isCompletado && toggleEstado72h(r.id)}
                      disabled={isCompletado}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
                      isCompletado
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none border border-transparent"
                        : "bg-amber-100 border border-amber-200 text-amber-800 hover:border-amber-500 hover:text-amber-900 hover:bg-amber-200 hover:shadow"
                    }`}
                  >
                    {isCompletado ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                    {isCompletado ? "Completado" : "Pendiente"}
                  </button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-slate-500 py-16">
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-slate-100 rounded-full">
                    <Circle className="h-6 w-6 text-slate-400" />
                  </div>
                  <p className="font-bold text-sm">Sin resultados</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
