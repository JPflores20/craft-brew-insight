import { createFileRoute } from "@tanstack/react-router";
import { FlaskConical, AlertTriangle, Droplets, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KpiCard } from "@/components/kpi-card";
import { StatusBadge } from "@/components/status-badge";
import { kpis, alertasRecientes, produccionSemanal } from "@/data/dashboard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Control de Elaboración" },
      { name: "description", content: "Resumen operativo del departamento de elaboración cervecera." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Resumen Operativo</h1>
        <p className="text-sm text-muted-foreground">Estado actual del departamento de elaboración</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Tanques en Fermentación" value={kpis.fermentando} icon={FlaskConical} tone="default" hint="de 60 totales" />
        <KpiCard label="Extractos fuera de rango" value={kpis.fueraRango} icon={AlertTriangle} tone="bad" hint="requieren acción" />
        <KpiCard label="Purgas pendientes hoy" value={kpis.purgasHoy} icon={Droplets} tone="warn" hint="próximas 24 hrs" />
        <KpiCard label="Mantenimientos programados" value={kpis.mantenimientos} icon={Wrench} tone="ok" hint="esta semana" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Últimas Alertas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanque</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Severidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alertasRecientes.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.tanque}</TableCell>
                    <TableCell className="text-sm">{a.tipo}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.hora}</TableCell>
                    <TableCell><StatusBadge status={a.severidad} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Volumen de Producción Semanal (hl)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={produccionSemanal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 250)" />
                  <XAxis dataKey="dia" stroke="oklch(0.55 0.04 257)" fontSize={12} />
                  <YAxis stroke="oklch(0.55 0.04 257)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid oklch(0.92 0.01 250)",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="hl" fill="oklch(0.78 0.16 75)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}