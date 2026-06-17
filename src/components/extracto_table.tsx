import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Circle } from "lucide-react";

interface ExtractoTableProps {
  rows: any[];
}

function formatDate(isoString: string | null | undefined) {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return format(d, "dd/MM HH:mm");
  } catch (e) {
    return isoString;
  }
}

export function ExtractoTable({ rows }: ExtractoTableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader className="bg-slate-100/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10 shadow-sm">
          <TableRow className="border-b-0 hover:bg-transparent">
            <TableHead className="border-r border-slate-200 text-sm font-extrabold tracking-widest text-slate-700 py-4">Marca</TableHead>
            <TableHead className="border-r border-slate-200 text-sm font-extrabold tracking-widest text-slate-700 py-4">Tanque</TableHead>
            <TableHead className="border-r border-slate-200 text-sm font-extrabold tracking-widest text-slate-700 py-4">Fecha Llenado</TableHead>
            <TableHead className="border-r border-slate-200 text-sm font-extrabold tracking-widest text-slate-700 py-4 text-center">24 Hrs</TableHead>
            <TableHead className="border-r border-slate-200 text-sm font-extrabold tracking-widest text-slate-700 py-4 text-center">48 Hrs</TableHead>
            <TableHead className="border-r border-slate-200 text-sm font-extrabold tracking-widest text-slate-700 py-4 text-center">72 Hrs</TableHead>
            <TableHead className="border-r border-slate-200 text-sm font-extrabold tracking-widest text-slate-700 py-4 text-center">96 Hrs</TableHead>
            <TableHead className="border-r border-slate-200 text-sm font-extrabold tracking-widest text-slate-700 py-4 text-center">120 Hrs</TableHead>
            <TableHead className="text-sm font-extrabold tracking-widest text-slate-700 py-4 text-center">144 Hrs</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id} className="hover:bg-amber-50/60 transition-colors border-b border-slate-100 group">
              <TableCell className="border-r border-slate-100 whitespace-nowrap py-3">
                <span className="inline-flex items-center rounded-lg bg-blue-100 px-3 py-1 text-sm font-black text-blue-800 border border-blue-200 shadow-sm">
                  {r.marca}
                </span>
              </TableCell>
              <TableCell className="border-r border-slate-100 font-black text-sm text-slate-900">{r.tanque}</TableCell>
              <TableCell className="border-r border-slate-100 text-sm font-bold tracking-tight whitespace-nowrap text-slate-700 tabular-nums">
                {formatDate(r.fechaLlenado)}
              </TableCell>
              <TableCell className={`border-r border-slate-100 text-sm whitespace-nowrap tabular-nums text-center ${!r.h24 ? 'text-slate-300' : 'text-slate-500 font-medium'}`}>{formatDate(r.h24)}</TableCell>
              <TableCell className={`border-r border-slate-100 text-sm whitespace-nowrap tabular-nums text-center ${!r.h48 ? 'text-slate-300' : 'text-slate-500 font-medium'}`}>{formatDate(r.h48)}</TableCell>
              <TableCell className={`border-r border-slate-100 text-sm whitespace-nowrap tabular-nums text-center ${!r.h72 ? 'text-slate-300' : 'text-slate-500 font-medium'}`}>{formatDate(r.h72)}</TableCell>
              <TableCell className={`border-r border-slate-100 text-sm whitespace-nowrap tabular-nums text-center ${!r.h96 ? 'text-slate-300' : 'text-slate-500 font-medium'}`}>{formatDate(r.h96)}</TableCell>
              <TableCell className={`border-r border-slate-100 text-sm whitespace-nowrap tabular-nums text-center ${!r.h120 ? 'text-slate-300' : 'text-slate-500 font-medium'}`}>{formatDate(r.h120)}</TableCell>
              <TableCell className={`text-sm whitespace-nowrap tabular-nums text-center ${!r.h144 ? 'text-slate-300' : 'text-slate-500 font-medium'}`}>{formatDate(r.h144)}</TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-slate-500 py-16">
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
