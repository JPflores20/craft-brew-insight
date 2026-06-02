import { Fragment } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Circle } from "lucide-react";
import { type PurgaRow, type AnalisisVisual } from "@/data/purgas";
import { cn } from "@/lib/utils";

const dot_color: Record<Exclude<AnalisisVisual, null>, string> = {
  Mala: "fill-status-bad text-status-bad",
  Regular: "fill-status-warn text-status-warn",
  Buena: "fill-status-ok text-status-ok",
};

function VisualDot({ a }: { a: AnalisisVisual }) {
  if (!a) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex items-center gap-1.5">
      <Circle className={cn("h-3 w-3", dot_color[a])} />
      <span className="text-xs">{a}</span>
    </div>
  );
}

export function PurgasTable({ rows }: { rows: PurgaRow[] }) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader className="bg-secondary">
          <TableRow>
            <TableHead rowSpan={2} className="border-r align-middle">Tanque</TableHead>
            <TableHead rowSpan={2} className="border-r align-middle">Marca</TableHead>
            <TableHead rowSpan={2} className="border-r align-middle whitespace-nowrap">Fecha Llenado</TableHead>
            <TableHead rowSpan={2} className="border-r align-middle whitespace-nowrap">Hrs Reposo</TableHead>
            {Array.from({ length: 10 }, (_, i) => (
              <TableHead key={i} colSpan={2} className="text-center border-r border-l">Purga {i + 1}</TableHead>
            ))}
            <TableHead rowSpan={2} className="align-middle text-center">Total</TableHead>
          </TableRow>
          <TableRow>
            {Array.from({ length: 10 }, (_, i) => (
              <Fragment key={i}>
                <TableHead className="text-xs whitespace-nowrap border-l">Hora</TableHead>
                <TableHead className="text-xs whitespace-nowrap border-r">Análisis</TableHead>
              </Fragment>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => {
            const total = r.purgas.filter((p) => p.analisis).length;
            return (
              <TableRow key={r.id}>
                <TableCell className="font-medium border-r">{r.tanque}</TableCell>
                <TableCell className="border-r whitespace-nowrap">{r.marca}</TableCell>
                <TableCell className="text-muted-foreground border-r whitespace-nowrap">{r.fechaLlenado}</TableCell>
                <TableCell className="border-r text-right tabular-nums">{r.horasReposo}h</TableCell>
                {r.purgas.map((p, i) => (
                  <Fragment key={i}>
                    <TableCell className="text-xs whitespace-nowrap border-l">{p.hora ?? "—"}</TableCell>
                    <TableCell className="border-r"><VisualDot a={p.analisis} /></TableCell>
                  </Fragment>
                ))}
                <TableCell className="text-center font-semibold">{total}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
