import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, ArrowDownAZ, ArrowUpZA } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PurgasTable } from "@/components/purgas_table";
import { useOperacionesStore } from "@/store/useOperacionesStore";
import { BRANDS } from "@/data/brands";
import { obtenerTurnoPorHora } from "@/data/turno";
import { parseMexicanDate } from "@/lib/utils";

export const Route = createFileRoute("/_app/purgas")({
  head: () => ({
    meta: [
      { title: "Purgas de Trub en Frío — Elaboración" },
      { name: "description", content: "Registro y control de descargas de sedimentos." },
    ],
  }),
  component: PurgasPage,
});

import { useEffect } from "react";

function PurgasPage() {
  const { purgas, fetchData, periodoActual, periodosDisponibles } = useOperacionesStore();
  const searchParams: any = useSearch({ strict: false });
  const [query, set_query] = useState(searchParams.tanque || "");
  const [marca, set_marca] = useState<string>("all");
  const [turno, set_turno] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    const results = purgas.filter((r) => {
      const match_q = !query || r.tanque.toLowerCase().includes(query.toLowerCase());
      const match_m = marca === "all" || r.marca === marca;
      const turnoCalculado = obtenerTurnoPorHora(r.fechaLlenado);
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
  }, [purgas, query, marca, turno, sortOrder]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Control de Purgas de Trub en Frío</h1>
          <p className="text-sm text-muted-foreground">Registro automatizado de descargas (Generado desde Extractos)</p>
        </div>
      </div>

      <Card className="shadow-xl border-t-4 border-t-emerald-500 bg-gradient-to-b from-card to-emerald-50/10 dark:to-emerald-950/10 mt-4 overflow-hidden rounded-2xl">
        <CardHeader className="bg-muted/20 border-b pb-6">
          <CardTitle className="text-xl font-extrabold flex items-center gap-2 tracking-tight">
            <span>Registro de Purgas</span>
          </CardTitle>
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => set_query(e.target.value)}
                placeholder="Buscar por tanque..."
                className="pl-9"
              />
            </div>
            
            <Select value={periodoActual} onValueChange={(v) => { fetchData(v); }}>
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

            <Select value={marca} onValueChange={set_marca}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Marca" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las marcas</SelectItem>
                {BRANDS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={turno} onValueChange={set_turno}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Turno de llenado" /></SelectTrigger>
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
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            >
              {sortOrder === "desc" ? (
                <><ArrowDownAZ className="h-4 w-4" /> Orden por fecha mas reciente</>
              ) : (
                <><ArrowUpZA className="h-4 w-4" /> Orden por fecha mas antigua</>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <PurgasTable rows={filtered} />
        </CardContent>
      </Card>
    </div>
  );
}

