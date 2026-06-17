import { Fragment, memo, useState } from "react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type PurgaRow as PurgaRowType } from "@/types/proceso";
import { useOperacionesStore } from "@/store/useOperacionesStore";
import { Circle } from "lucide-react";

const EMPLEADOS = ["LAMD", "MJFA", "VHAL", "OEVM", "ORC", "PLRG"];
const TIEMPOS = ["1", "2", "3", "4", "5", "6", "7"];

function formatDate(isoString?: string | null) {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    // Quitamos el año para reducir ruido (ej: 16/06 21:14)
    return format(d, "dd/MM HH:mm");
  } catch {
    return isoString;
  }
}

const PurgaRow = memo(({ r }: { r: PurgaRowType }) => {
  const updatePurgaField = useOperacionesStore(s => s.updatePurgaField);

  return (
    <TableRow className="hover:bg-amber-50/60 transition-colors border-b border-slate-100 group">
      {/* Marca */}
      <TableCell className="whitespace-nowrap py-3">
        <span className="inline-flex items-center rounded-lg bg-blue-100 px-3 py-1 text-sm font-black text-blue-800 border border-blue-200 shadow-sm">
          {r.marca}
        </span>
      </TableCell>

      {/* Tanque */}
      <TableCell className="font-black text-sm text-slate-900">{r.tanque}</TableCell>

      {/* Fecha Llenado */}
      <TableCell className="text-sm font-bold tracking-tight whitespace-nowrap text-slate-700 tabular-nums">
        {formatDate(r.fechaLlenado)}
      </TableCell>

      {/* 8 Purgas */}
      {r.purgas.map((p, i) => (
        <Fragment key={i}>
          <TableCell className="text-sm whitespace-nowrap font-medium text-slate-500 tabular-nums border-l border-slate-100 text-center">
            {formatDate(p.fechaHora)}
          </TableCell>
          <TableCell className="text-center p-1">
            <select
              value={p.tiempo ? String(p.tiempo) : ""}
              onChange={(e) => updatePurgaField(r.id, i + 1, "tiempo", e.target.value)}
              className={`h-7 w-[55px] mx-auto bg-transparent border hover:border-amber-300 hover:bg-white rounded text-sm font-bold px-1 text-center cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500 appearance-none transition-colors ${
                p.tiempo ? "border-amber-200 text-amber-900 bg-amber-50" : "border-transparent text-slate-400"
              }`}
            >
              <option value="" disabled className="text-slate-300 font-medium">—</option>
              {TIEMPOS.map(t => <option key={t} value={t} className="text-slate-800">{t} min</option>)}
            </select>
          </TableCell>
          <TableCell className="border-r border-slate-100 text-center p-1">
            <select
              value={p.realiza || ""}
              onChange={(e) => updatePurgaField(r.id, i + 1, "realiza", e.target.value)}
              className={`h-7 w-[65px] mx-auto bg-transparent border hover:border-amber-300 hover:bg-white rounded text-sm font-bold px-1 text-center cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500 appearance-none transition-colors ${
                p.realiza ? "border-amber-200 text-amber-900 bg-amber-50" : "border-transparent text-slate-400"
              }`}
            >
              <option value="" disabled className="text-slate-300 font-medium">—</option>
              {EMPLEADOS.map(emp => <option key={emp} value={emp} className="text-slate-800">{emp}</option>)}
            </select>
          </TableCell>
        </Fragment>
      ))}
    </TableRow>
  );
});

PurgaRow.displayName = "PurgaRow";

const ITEMS_PER_PAGE = 20;

export function PurgasTable({ rows }: { rows: PurgaRowType[] }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / ITEMS_PER_PAGE));
  const paginatedRows = rows.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="space-y-4">
      <div className="w-full overflow-x-auto">
        <Table className="w-max min-w-full text-sm">
          <TableHeader className="bg-slate-100/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20 shadow-sm">
            <TableRow className="border-b border-slate-200 hover:bg-transparent">
              <TableHead rowSpan={2} className="border-r border-slate-200 align-middle text-sm font-extrabold  tracking-widest text-slate-700 min-w-[130px]">Marca</TableHead>
              <TableHead rowSpan={2} className="border-r border-slate-200 align-middle text-sm font-extrabold  tracking-widest text-slate-700 min-w-[80px]">Tanque</TableHead>
              <TableHead rowSpan={2} className="border-r border-slate-200 align-middle text-sm font-extrabold  tracking-widest text-slate-700 whitespace-nowrap min-w-[150px]">Fecha Llenado</TableHead>
              {Array.from({ length: 8 }, (_, i) => (
                <TableHead key={i} colSpan={3} className="text-center border-r border-slate-200 text sm font-extrabold  tracking-widest text-slate-700">
                  Purga {i + 1}
                </TableHead>
              ))}
            </TableRow>
            <TableRow className="border-b-0 hover:bg-transparent">
              {Array.from({ length: 8 }, (_, i) => (
                <Fragment key={i}>
                  <TableHead className="text-sm whitespace-nowrap font-bold  tracking-wider text-slate-500 text-center min-w-[130px]">Fecha / Hora</TableHead>
                  <TableHead className="text-sm whitespace-nowrap font-bold  tracking-wider text-slate-500 text-center min-w-[60px]">Tiempo</TableHead>
                  <TableHead className="text-sm whitespace-nowrap font-bold  tracking-wider text-slate-500 text-center border-r border-slate-200 min-w-[70px]">Realiza</TableHead>
                </Fragment>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={27} className="text-center text-slate-500 py-16">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-slate-100 rounded-full">
                      <Circle className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="font-bold text-sm">Sin resultados</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((r) => <PurgaRow key={r.id} r={r} />)
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm font-bold text-slate-600">
            Mostrando {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, rows.length)} de {rows.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm font-bold border border-slate-200 bg-white rounded hover:bg-slate-100 disabled:opacity-50 transition-colors"
            >
              Anterior
            </button>
            <span className="text-sm font-bold px-2 text-slate-700">Página {page} de {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 text-sm font-bold border border-slate-200 bg-white rounded hover:bg-slate-100 disabled:opacity-50 transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
