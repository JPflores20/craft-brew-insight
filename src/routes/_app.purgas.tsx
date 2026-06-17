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
      { title: "Purgas de Trub" },
      { name: "description", content: "Registro y Control de Purgas." },
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
  const [turno, set_turno] = useState<string>(() => obtenerTurnoPorHora(new Date().toISOString()) || "all");
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
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <div className="flex flex-col gap-4 bg-white/50 p-6 rounded-2xl border border-slate-100 shadow-sm backdrop-blur-sm">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Control de Purgas de Trub en Frío</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">8 purgas cada 8 Hr hasta las 64 Hr</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-56 shrink-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => set_query(e.target.value)}
              placeholder="Buscar por tanque..."
              className="pl-9 bg-slate-50 border-slate-200 rounded-xl h-10 font-medium"
            />
          </div>
          
          <Select value={periodoActual} onValueChange={(v) => { fetchData(v); }}>
            <SelectTrigger className="w-36 bg-slate-50 border-slate-200 rounded-xl h-10 font-medium"><SelectValue placeholder="Mes" /></SelectTrigger>
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
            <SelectTrigger className="w-40 bg-slate-50 border-slate-200 rounded-xl h-10 font-medium"><SelectValue placeholder="Marca" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las marcas</SelectItem>
              {BRANDS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={turno} onValueChange={(v) => { set_turno(v); }}>
            <SelectTrigger className="w-40 bg-slate-50 border-slate-200 rounded-xl h-10 font-medium"><SelectValue placeholder="Turno" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los turnos</SelectItem>
              <SelectItem value="Turno 1">Turno 1</SelectItem>
              <SelectItem value="Turno 2">Turno 2</SelectItem>
              <SelectItem value="Turno 3">Turno 3</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            className="gap-2 bg-slate-50 border-slate-200 rounded-xl h-10 font-medium ml-auto"
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
          >
            {sortOrder === "desc" ? (
              <><ArrowDownAZ className="h-4 w-4" /> Más recientes</>
            ) : (
              <><ArrowUpZA className="h-4 w-4" /> Más antiguos</>
            )}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-4">
        <div className="p-0">
          <div className="pt-0">
            <PurgasTable rows={filtered} />
          </div>
        </div>
      </div>
    </div>
  );
}
