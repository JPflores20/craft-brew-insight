import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status_badge";

interface ExtractoTableProps {
  rows: any[];
}

export function ExtractoTable({ rows }: ExtractoTableProps) {
  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader className="bg-secondary sticky top-0">
          <TableRow>
            <TableHead>Marca</TableHead>
            <TableHead>Tanque</TableHead>
            <TableHead>Fecha Llenado</TableHead>
            <TableHead className="text-right">OG (ºP)</TableHead>
            <TableHead className="text-right">24 Hrs</TableHead>
            <TableHead className="text-right">48 Hrs</TableHead>
            <TableHead className="text-right">72 Hrs</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.marca}</TableCell>
              <TableCell>{r.tanque}</TableCell>
              <TableCell className="text-muted-foreground">{r.fechaLlenado}</TableCell>
              <TableCell className="text-right tabular-nums">{r.og.toFixed(2)}</TableCell>
              <TableCell className="text-right tabular-nums">{r.h24.toFixed(2)}</TableCell>
              <TableCell className="text-right tabular-nums">{r.h48.toFixed(2)}</TableCell>
              <TableCell className="text-right tabular-nums font-semibold">{r.h72.toFixed(2)}</TableCell>
              <TableCell><StatusBadge status={r.estado} /></TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                Sin resultados
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
