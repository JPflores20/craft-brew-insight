import { createFileRoute } from "@tanstack/react-router";
import { FlaskConical, Clock, CheckCircle2, TrendingUp, Droplets } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { useOperacionesStore } from "@/store/useOperacionesStore";
import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { obtenerTurnoPorHora } from "@/data/turno";
import { parseMexicanDate } from "@/lib/utils";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Control de Elaboración" },
      { name: "description", content: "Resumen operativo del departamento de elaboración cervecera." },
    ],
  }),
  component: Dashboard,
});

const BAR_COLORS = [
  "#f59e0b", "#d97706", "#b45309", "#92400e",
  "#0ea5e9", "#0284c7", "#0369a1",
  "#10b981", "#059669",
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-sm">
        <p className="font-semibold text-foreground">{label}</p>
        <p className="text-primary font-bold mt-0.5">{payload[0].value} registros</p>
      </div>
    );
  }
  return null;
};

interface KpiProps { label: string; value: number | string; icon: any; sub?: string; color: string; bg: string; }

function KpiCard({ label, value, icon: Icon, sub, color, bg }: KpiProps) {
  return (
    <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${bg}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground font-medium truncate">{label}</p>
          {sub && <p className="text-[11px] text-muted-foreground/60 mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const { extractos, periodosStats, isLoading, fetchData } = useOperacionesStore();

  useEffect(() => { fetchData("todos"); }, [fetchData]);

  const periodoActivo = useOperacionesStore.getState().periodoActual || "2026-06";
  const extractosPeriodoActivo = extractos.filter(e => {
    if (!e.fechaLlenado) return false;
    const date = parseMexicanDate(e.fechaLlenado);
    if (!date) return false;
    return format(date, "yyyy-MM") === periodoActivo;
  });

  const fermentando   = extractosPeriodoActivo.length;
  const completados72 = extractosPeriodoActivo.filter(e => e.h72 && e.estado72h === "Completado").length;
  const pendientes72  = extractosPeriodoActivo.filter(e => e.h72 && e.estado72h !== "Completado").length;
  const pendientes24  = extractosPeriodoActivo.filter(e => e.h24 && e.estado24h !== "Completado").length;
  const completados24  = extractosPeriodoActivo.filter(e => e.h24 && e.estado24h === "Completado").length;


  const [mesFiltro, setMesFiltro] = useState<string>("todos");
  const [tipoGrafica, setTipoGrafica] = useState<"marca" | "mes">("marca");

  // Meses disponibles a partir de fechaLlenado
  const mesesDisponibles = useMemo(() => {
    const seen = new Map<string, string>();
    extractos.forEach(e => {
      if (!e.fechaLlenado) return;
      const d = parseMexicanDate(e.fechaLlenado);
      if (!d) return;
      const key = format(d, "yyyy-MM");
      const label = format(d, "MMMM yyyy", { locale: es });
      if (!seen.has(key)) seen.set(key, label);
    });
    return Array.from(seen.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, label]) => ({ key, label }));
  }, [extractos]);

  // Extractos filtrados por mes (Solo para la gráfica de Marcas)
  const extractosFiltrados = useMemo(() => {
    if (mesFiltro === "todos") return extractos;
    return extractos.filter(e => {
      if (!e.fechaLlenado) return false;
      const d = parseMexicanDate(e.fechaLlenado);
      if (!d) return false;
      return format(d, "yyyy-MM") === mesFiltro;
    });
  }, [extractos, mesFiltro]);

  // Contar por marca dentro del mes seleccionado
  const brandCounts = useMemo(() => {
    return extractosFiltrados.reduce((acc, curr) => {
      acc[curr.marca] = (acc[curr.marca] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [extractosFiltrados]);

  const chartDataMarca = Object.entries(brandCounts)
    .map(([marca, total]) => ({ name: marca, total }))
    .sort((a, b) => b.total - a.total);

  const chartDataMes = [...periodosStats].sort((a, b) => a.periodo.localeCompare(b.periodo)).map(p => {
    const [y, m] = p.periodo.split("-");
    const date = new Date(parseInt(y), parseInt(m) - 1, 1);
    const mesStr = date.toLocaleString("es-MX", { month: "short", year: "2-digit" });
    return { name: mesStr.charAt(0).toUpperCase() + mesStr.slice(1), total: p.totalRegistros };
  });

  const chartData = tipoGrafica === "marca" ? chartDataMarca : chartDataMes;

  const ahora = new Date();
  const turnoActual = obtenerTurnoPorHora(ahora.toISOString());

  const proximos72 = extractos
    .filter(e => e.h72 && e.estado72h !== "Completado")
    .map(e => ({ ...e, parsedH72: parseMexicanDate(e.h72) }))
    .filter(e => e.parsedH72 && e.parsedH72 > ahora)
    .filter(e => obtenerTurnoPorHora(e.parsedH72!.toISOString()) === turnoActual)
    .sort((a, b) => a.parsedH72!.getTime() - b.parsedH72!.getTime())
    .slice(0, 6);

   const proximos24 = extractos
    .filter(e => e.h24 && e.estado24h !== "Completado")
    .map(e => ({ ...e, parsedH24: parseMexicanDate(e.h24) }))
    .filter(e => e.parsedH24 && e.parsedH24 > ahora)
    .filter(e => obtenerTurnoPorHora(e.parsedH24!.toISOString()) === turnoActual)
    .sort((a, b) => a.parsedH24!.getTime() - b.parsedH24!.getTime())
    .slice(0, 6);

  // Próximas Purgas 8 = fechaLlenado + 64 horas, solo las futuras y del turno actual
  const proximasPurgas = extractos
    .filter(e => e.fechaLlenado)
    .map(e => {
      const parsedLlenado = parseMexicanDate(e.fechaLlenado);
      return {
        id: e.id,
        tanque: e.tanque,
        marca: e.marca,
        fechaPurga8: parsedLlenado ? new Date(parsedLlenado.getTime() + 64 * 60 * 60 * 1000) : null,
      };
    })
    .filter(e => e.fechaPurga8 && e.fechaPurga8 > ahora)
    // @ts-ignore: Ya sabemos que fechaPurga8 no es null aquí
    .filter(e => obtenerTurnoPorHora(e.fechaPurga8.toISOString()) === turnoActual)
    // @ts-ignore
    .sort((a, b) => a.fechaPurga8.getTime() - b.fechaPurga8.getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Tablero General</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Monitor de Purgas y Chequeo de Platos</p>
        </div>
      </div>

      {/* KPIs */}
      {isLoading ? (
        <div className="grid gap-4 grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="h-24 animate-pulse bg-muted/50 border-border/50" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-3">
          <KpiCard
            label="Tanques en Fermentación"
            value={fermentando}
            icon={FlaskConical}
            sub="registros activos"
            color="text-amber-600"
            bg="bg-amber-50"
          />
          <KpiCard
            label="Chequeos 72h Pendientes"
            value={pendientes72}
            icon={Clock}
            sub="por realizar"
            color="text-sky-600"
            bg="bg-sky-50"
          />
          <KpiCard
            label="Chequeos 72h Completados"
            value={completados72}
            icon={CheckCircle2}
            sub="confirmados"
            color="text-emerald-600"
            bg="bg-emerald-50"
          />
         
        </div>
      )}
      
      
      <div className="grid gap-5 grid-cols-1 lg:grid-cols-3 mb-5">
        {/* Proximos Chequeos 24 HR */}
        <div>
          <Card className="h-full border-border shadow-sm flex flex-col">
            <CardHeader className="py-4 px-5 border-b border-border/50 bg-muted/20">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Clock className="h-4 w-4 text-sky-500" />
                Próximos Chequeos 24h
              </CardTitle>
              <p className="text-xs text-muted-foreground font-medium">Chequeos de tu turno actual</p>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col">
              {proximos24.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-muted-foreground text-center">
                  <CheckCircle2 className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm">Todo al día</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {proximos24.map((ext) => (
                    <div key={ext.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                      <div>
                        <p className="font-semibold text-sm text-foreground">Tanque {ext.tanque}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{ext.marca}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-sky-600">
                          {format(ext.parsedH24!, "HH:mm")}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {format(ext.parsedH24!, "d MMM", { locale: es })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        {/* Proximos Chequeos 72h */}
        <div>
          <Card className="h-full border-border shadow-sm flex flex-col">
            <CardHeader className="py-4 px-5 border-b border-border/50 bg-muted/20">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Clock className="h-4 w-4 text-sky-500" />
                Próximos Chequeos 72h
              </CardTitle>
              <p className="text-xs text-muted-foreground font-medium">Chequeos de tu turno actual</p>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col">
              {proximos72.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-muted-foreground text-center">
                  <CheckCircle2 className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm">Todo al día</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {proximos72.map((ext) => (
                    <div key={ext.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                      <div>
                        <p className="font-semibold text-sm text-foreground">Tanque {ext.tanque}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{ext.marca}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-sky-600">
                          {format(ext.parsedH72!, "HH:mm")}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {format(ext.parsedH72!, "d MMM", { locale: es })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Proximas Purgas */}
        <div>
          <Card className="h-full border-border shadow-sm flex flex-col">
            <CardHeader className="py-4 px-5 border-b border-border/50 bg-muted/20">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Droplets className="h-4 w-4 text-rose-500" />
                Próximas Purgas
              </CardTitle>
              <p className="text-xs text-muted-foreground font-medium">Purgas de tu turno actual (8ª - 64 hrs)</p>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col">
              {proximasPurgas.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-muted-foreground text-center">
                  <CheckCircle2 className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm">Sin purgas en este turno</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {proximasPurgas.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                      <div>
                        <p className="font-semibold text-sm text-foreground">Tanque {p.tanque}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{p.marca}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-rose-600">
                          {format(p.fechaPurga8!, "HH:mm")}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {format(p.fechaPurga8!, "d MMM", { locale: es })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Chart row */}
      <div className="grid gap-5 mt-5">
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-0 pt-5 px-5" >
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2 cursor-pointer" onClick={() => setTipoGrafica(tipoGrafica === "marca" ? "mes" : "marca")}>
                  <TrendingUp className="h-4 w-4 text-primary" />
                  {tipoGrafica === "marca" ? "Distribución por Marca" : "Distribución por Meses"}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5 cursor-pointer hover:underline" onClick={() => setTipoGrafica(tipoGrafica === "marca" ? "mes" : "marca")}>
                  {tipoGrafica === "marca" ? "Clic aquí para ver por meses" : "Clic aquí para ver por marca"}
                </p>
              </div>
              {tipoGrafica === "marca" && (
                <select
                  value={mesFiltro}
                  onChange={e => setMesFiltro(e.target.value)}
                  className="shrink-0 h-8 rounded-md border border-border bg-background px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                >
                  <option value="todos">Todos los meses</option>
                  {mesesDisponibles.map(m => (
                    <option key={m.key} value={m.key} className="capitalize">{m.label}</option>
                  ))}
                </select>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-3 px-3 pb-4">
            <div className="h-[400px] w-full">
              {chartData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                  <FlaskConical className="h-10 w-10 opacity-20" />
                  <p className="text-sm">Sin datos para mostrar.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      angle={-40}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={40}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
