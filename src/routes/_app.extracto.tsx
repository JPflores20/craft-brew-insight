import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ExtractoTable } from "@/components/extracto_table";
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

const page_size = 10;

function ExtractoPage() {
  const [query, set_query] = useState("");
  const [marca, set_marca] = useState<string>("all");
  const [page, set_page] = useState(0);

  const filtered = useMemo(() => {
    return extractoData.filter((r) => {
      const match_q = !query || r.tanque.toLowerCase().includes(query.toLowerCase());
      const match_m = marca === "all" || r.marca === marca;
      return match_q && match_m;
    });
  }, [query, marca]);

  const pages = Math.max(1, Math.ceil(filtered.length / page_size));
  const rows = filtered.slice(page * page_size, (page + 1) * page_size);

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
                onChange={(e) => { set_query(e.target.value); set_page(0); }}
                placeholder="Buscar por tanque..."
                className="pl-9"
              />
            </div>
            <Select value={marca} onValueChange={(v) => { set_marca(v); set_page(0); }}>
              <SelectTrigger className="w-56"><SelectValue placeholder="Marca" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las marcas</SelectItem>
                {BRANDS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
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