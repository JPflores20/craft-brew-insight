import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Search, ArrowDownAZ, ArrowUpZA } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ExtractoTable } from "@/components/extracto_table";
import { UploadExtractos } from "@/components/subir_archivos_extracto";
import { BRANDS } from "@/data/brands";
import { useOperacionesStore } from "@/store/useOperacionesStore";
import { obtenerTurnoPorHora } from "@/data/turno";
import { parseMexicanDate } from "@/lib/utils";

export const Route = createFileRoute("/_app/extracto")({
  head: () => ({
    meta: [
      { title: "Extracto 144 Hrs — Elaboración" },
      { name: "description", content: "Monitoreo de atenuación del mosto hasta 144 horas." },
    ],
  }),
  component: ExtractoPage,
});

const page_size = 50;

function ExtractoPage() {
  const { extractos, fetchData, periodoActual, periodosDisponibles } = useOperacionesStore();
  const searchParams: any = useSearch({ strict: false });
  const [query, set_query] = useState(searchParams.tanque || "");
  const [marca, set_marca] = useState<string>("all");
  const [turno, set_turno] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [page, set_page] = useState(0);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    const results = extractos.filter((r) => {
      const match_q = !query || r.tanque.toLowerCase().includes(query.toLowerCase());
      const match_m = marca === "all" || r.marca === marca;
      const turnoCalculado = r.h72 ? obtenerTurnoPorHora(r.h72) : null;
      const match_t = turno === "all" || turnoCalculado === turno;
      return match_q && match_m && match_t;
    });

    return results.sort((a, b) => {
      const parsedA = parseMexicanDate(a.fechaLlenado);
      const parsedB = parseMexicanDate(b.fechaLlenado);
      const dateA = parsedA ? parsedA.getTime() : 0;
      const dateB = parsedB ? parsedB.getTime() : 0;
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });
  }, [extractos, query, marca, turno, sortOrder]);

  const pages = Math.max(1, Math.ceil(filtered.length / page_size));
  const rows = filtered.slice(page * page_size, (page + 1) * page_size);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Extracto 144 Hrs</h1>
          <p className="text-sm text-muted-foreground">Monitoreo de atenuación del mosto</p>
        </div>

      </div>
      
      <UploadExtractos />

      <Card className="shadow-xl border-t-4 border-t-emerald-500 bg-gradient-to-b from-card to-emerald-50/10 dark:to-emerald-950/10 mt-4 overflow-hidden rounded-2xl">
        <CardHeader className="bg-muted/20 border-b pb-6">
          <CardTitle className="text-xl font-extrabold flex items-center gap-2 tracking-tight">
            <span>Lecturas de Extracto</span>
          </CardTitle>
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => { set_query(e.target.value); set_page(0); }}
                placeholder="Buscar por tanque..."
                className="pl-9"
              />
            </div>
            
            <Select value={periodoActual} onValueChange={(v) => { fetchData(v); set_page(0); }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Mes" /></SelectTrigger>
              <SelectContent>
                {periodosDisponibles.map((p) => {
                  const [y, m] = p.split("-");
                  const date = new Date(parseInt(y), parseInt(m) - 1, 1);
                  const mesStr = date.toLocaleString("es-MX", { month: "long", year: "numeric" });
                  return (
                    <SelectItem key={p} value={p}>
                      {mesStr.charAt(0).toUpperCase() + mesStr.slice(1)}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <Select value={marca} onValueChange={(v) => { set_marca(v); set_page(0); }}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Marca" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las marcas</SelectItem>
                {BRANDS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={turno} onValueChange={(v) => { set_turno(v); set_page(0); }}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Turno (72 Hrs)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los turnos</SelectItem>
                <SelectItem value="Turno 1">Turno 1 (23:00-05:59)</SelectItem>
                <SelectItem value="Turno 2">Turno 2 (06:00-15:29)</SelectItem>
                <SelectItem value="Turno 3">Turno 3 (15:30-22:59)</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => {
                setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                set_page(0);
              }}
            >
              {sortOrder === "desc" ? (
                <><ArrowDownAZ className="h-4 w-4" /> Orden por fecha mas reciente</>
              ) : (
                <><ArrowUpZA className="h-4 w-4" /> Orden por fecha mas antigua</>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ExtractoTable rows={rows} />
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {filtered.length} registros · Página {page + 1} de {pages}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => set_page((p) => p - 1)}>Anterior</Button>
              <Button variant="outline" size="sm" disabled={page >= pages - 1} onClick={() => set_page((p) => p + 1)}>Siguiente</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

