import { createFileRoute } from "@tanstack/react-router";
import { useState, Fragment } from "react";
import { Plus, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { purgasInitial, type PurgaRow, type AnalisisVisual } from "@/data/purgas";
import { TANKS } from "@/data/brands";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/purgas")({
  head: () => ({
    meta: [
      { title: "Purgas de Trub en Frío — Elaboración" },
      { name: "description", content: "Registro y control de descargas de sedimentos." },
    ],
  }),
  component: PurgasPage,
});

const dotColor: Record<Exclude<AnalisisVisual, null>, string> = {
  Mala: "fill-status-bad text-status-bad",
  Regular: "fill-status-warn text-status-warn",
  Buena: "fill-status-ok text-status-ok",
};

function VisualDot({ a }: { a: AnalisisVisual }) {
  if (!a) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex items-center gap-1.5">
      <Circle className={cn("h-3 w-3", dotColor[a])} />
      <span className="text-xs">{a}</span>
    </div>
  );
}

function PurgasPage() {
  const [rows, setRows] = useState<PurgaRow[]>(purgasInitial);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ tanque: TANKS[0], numero: "1", hora: "", analisis: "Buena" as Exclude<AnalisisVisual, null> });

  function submit() {
    const n = parseInt(form.numero) - 1;
    if (n < 0 || n > 9) return;
    setRows((prev) => prev.map((r) => {
      if (r.tanque !== form.tanque) return r;
      const purgas = [...r.purgas];
      purgas[n] = { hora: form.hora, analisis: form.analisis };
      return { ...r, purgas };
    }));
    setOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Control de Purgas de Trub en Frío</h1>
          <p className="text-sm text-muted-foreground">Registro de descargas de sedimentos por tanque</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Registrar Nueva Purga</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Registrar purga</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tanque</Label>
                <Select value={form.tanque} onValueChange={(v) => setForm({ ...form, tanque: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    {rows.map((r) => <SelectItem key={r.tanque} value={r.tanque}>{r.tanque}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nº de purga (1-10)</Label>
                <Input type="number" min={1} max={10} value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} />
              </div>
              <div>
                <Label>Hora</Label>
                <Input type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} />
              </div>
              <div>
                <Label>Análisis visual</Label>
                <Select value={form.analisis} onValueChange={(v) => setForm({ ...form, analisis: v as Exclude<AnalisisVisual, null> })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mala">Mala</SelectItem>
                    <SelectItem value="Regular">Regular</SelectItem>
                    <SelectItem value="Buena">Buena</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={submit}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base">Registro de purgas</CardTitle></CardHeader>
        <CardContent>
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