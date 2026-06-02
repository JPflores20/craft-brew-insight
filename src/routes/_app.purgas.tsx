import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PurgasDialog } from "@/components/purgas_dialog";
import { PurgasTable } from "@/components/purgas_table";
import { purgasInitial, type PurgaRow, type AnalisisVisual } from "@/data/purgas";
import { TANKS } from "@/data/brands";

export const Route = createFileRoute("/_app/purgas")({
  head: () => ({
    meta: [
      { title: "Purgas de Trub en Frío — Elaboración" },
      { name: "description", content: "Registro y control de descargas de sedimentos." },
    ],
  }),
  component: PurgasPage,
});

function PurgasPage() {
  const [rows, set_rows] = useState<PurgaRow[]>(purgasInitial);
  const [open, set_open] = useState(false);
  const [form, set_form] = useState({ tanque: TANKS[0], numero: "1", hora: "", analisis: "Buena" as Exclude<AnalisisVisual, null> });

  function submit() {
    const n = parseInt(form.numero) - 1;
    if (n < 0 || n > 9) return;
    set_rows((prev) => prev.map((r) => {
      if (r.tanque !== form.tanque) return r;
      const purgas = [...r.purgas];
      purgas[n] = { hora: form.hora, analisis: form.analisis };
      return { ...r, purgas };
    }));
    set_open(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Control de Purgas de Trub en Frío</h1>
          <p className="text-sm text-muted-foreground">Registro de descargas de sedimentos por tanque</p>
        </div>
        <PurgasDialog 
          open={open} 
          set_open={set_open} 
          form={form} 
          set_form={set_form} 
          rows={rows} 
          submit={submit} 
        />
      </div>

      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base">Registro de purgas</CardTitle></CardHeader>
        <CardContent>
          <PurgasTable rows={rows} />
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><Circle className="h-3 w-3 fill-status-bad text-status-bad" /> Mala</div>
            <div className="flex items-center gap-1.5"><Circle className="h-3 w-3 fill-status-warn text-status-warn" /> Regular</div>
            <div className="flex items-center gap-1.5"><Circle className="h-3 w-3 fill-status-ok text-status-ok" /> Buena</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}