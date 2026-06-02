import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { extractoData } from "@/data/extracto";
import { BRANDS } from "@/data/brands";

export const Route = createFileRoute("/_app/extracto")({
  head: () => ({
    meta: [
      { title: "Extracto 72 Hrs — Elaboración" },
      { name: "description", content: "Monitoreo de atenuación del mosto a 24, 48 y 72 horas." },
    ],
  }),
  component: ExtractoPage,
});

const PAGE_SIZE = 10;

function ExtractoPage() {
  const [query, setQuery] = useState("");
  const [marca, setMarca] = useState<string>("all");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    return extractoData.filter((r) => {
      const matchQ = !query || r.tanque.toLowerCase().includes(query.toLowerCase());
      const matchM = marca === "all" || r.marca === marca;
      return matchQ && matchM;
    });
  }, [query, marca]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Extracto 72 Hrs</h1>
        <p className="text-sm text-muted-foreground">Monitoreo de atenuación del mosto</p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Lecturas de extracto</CardTitle>
          <div className="mt-3 flex flex-wrap gap-3">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(0); }}
                placeholder="Buscar por tanque..."
                className="pl-9"
              />
            </div>
            <Select value={marca} onValueChange={(v) => { setMarca(v); setPage(0); }}>
              <SelectTrigger className="w-56"><SelectValue placeholder="Marca" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las marcas</SelectItem>
                {BRANDS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
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
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {filtered.length} registros · Página {page + 1} de {pages}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
              <Button variant="outline" size="sm" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}