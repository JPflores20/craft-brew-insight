import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TANKS } from "@/data/brands";
import { getCurva, type FermentPoint } from "@/data/fermentacion";
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceArea } from "recharts";

export const Route = createFileRoute("/_app/curvas")({
  head: () => ({
    meta: [
      { title: "Curvas de Fermentación — Elaboración" },
      { name: "description", content: "Visualización físico-química del proceso de fermentación." },
    ],
  }),
  component: CurvasPage,
});

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p: FermentPoint = payload[0].payload;
  return (
    <div className="rounded-md border bg-card p-3 text-xs shadow-md">
      <div className="font-semibold mb-1">Día {p.dia} · {p.fase}</div>
      <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-500"/>Extracto: <span className="font-medium">{p.extracto} ºP</span></div>
      <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-red-500"/>Temperatura: <span className="font-medium">{p.temperatura} ºC</span></div>
    </div>
  );
}

function CurvasPage() {
  const [tanque, setTanque] = useState(TANKS[0]);
  const data = useMemo(() => getCurva(tanque), [tanque]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Curvas de Fermentación</h1>
          <p className="text-sm text-muted-foreground">Evolución de extracto aparente y temperatura</p>
        </div>
        <div className="w-64">
          <Select value={tanque} onValueChange={setTanque}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-72">
              {TANKS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Tanque {tanque}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[420px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 250)" />
                <XAxis dataKey="dia" label={{ value: "Día", position: "insideBottom", offset: -5, fontSize: 12 }} fontSize={12} />
                <YAxis yAxisId="left" stroke="oklch(0.55 0.18 250)" domain={[0, 16]} label={{ value: "Extracto (ºP)", angle: -90, position: "insideLeft", fontSize: 12, fill: "oklch(0.55 0.18 250)" }} fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="oklch(0.62 0.23 27)" domain={[-5, 20]} label={{ value: "Temperatura (ºC)", angle: 90, position: "insideRight", fontSize: 12, fill: "oklch(0.62 0.23 27)" }} fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <ReferenceArea yAxisId="right" x1={12} x2={15} fill="oklch(0.92 0.05 250)" fillOpacity={0.4} />
                <Line yAxisId="left" type="monotone" dataKey="extracto" name="Extracto Aparente (ºP)" stroke="oklch(0.55 0.18 250)" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="temperatura" name="Temperatura (ºC)" stroke="oklch(0.62 0.23 27)" strokeWidth={2.5} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}