import { createFileRoute, Link } from "@tanstack/react-router";
import { FlaskConical, Clock, CheckCircle2, TrendingUp, Droplets, Database } from "lucide-react";
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
    <Card className="border-border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-32 h-32 opacity-20 rounded-full blur-3xl -mr-10 -mt-10 transition-all duration-500 group-hover:scale-150 ${bg}`} />
      <CardContent className="flex items-center gap-4 p-6 relative z-10">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${bg} shadow-inner`}>
          <Icon className={`h-7 w-7 ${color}`} />
        </div>
        <div className="min-w-0">
          <p className="text-3xl font-black text-foreground tracking-tight drop-shadow-sm">{value}</p>
          <p className="text-xs font-bold text-muted-foreground mt-0.5">{label}</p>
          {sub && <p className="text-[10px] text-muted-foreground/60 font-bold mt-1">{sub}</p>}
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
    .map(([marca, total]) => ({ name: marca.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), total }))
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

  const getLimitesTurnoActual = (now: Date) => {
    const start = new Date(now);
    const end = new Date(now);
    start.setSeconds(0); start.setMilliseconds(0);
    end.setSeconds(59); end.setMilliseconds(999);
    const h = now.getHours();
    const m = now.getMinutes();
    const mins = h * 60 + m;

    if (mins >= 6 * 60 && mins < 15 * 60 + 30) {
      start.setHours(6, 0);
      end.setHours(15, 29);
    } else if (mins >= 15 * 60 + 30 && mins < 23 * 60) {
      start.setHours(15, 30);
      end.setHours(22, 59);
    } else {
      if (h >= 23) {
        start.setHours(23, 0);
        end.setDate(end.getDate() + 1);
        end.setHours(5, 59);
      } else {
        start.setDate(start.getDate() - 1);
        start.setHours(23, 0);
        end.setHours(5, 59);
      }
    }
    return { start, end };
  };

  const { start: inicioTurno, end: finTurno } = getLimitesTurnoActual(ahora);

  const proximos72 = extractos
    .filter(e => e.h72 && e.estado72h !== "Completado")
    .map(e => ({ ...e, parsedH72: parseMexicanDate(e.h72) }))
    .filter(e => e.parsedH72 && e.parsedH72 >= inicioTurno && e.parsedH72 <= finTurno)
    .sort((a, b) => a.parsedH72!.getTime() - b.parsedH72!.getTime())
    .slice(0, 6);

   const proximos24 = extractos
    .filter(e => e.h24 && e.estado24h !== "Completado")
    .map(e => ({ ...e, parsedH24: parseMexicanDate(e.h24) }))
    .filter(e => e.parsedH24 && e.parsedH24 >= inicioTurno && e.parsedH24 <= finTurno)
    .sort((a, b) => a.parsedH24!.getTime() - b.parsedH24!.getTime())
    .slice(0, 6);

  // Próximas Purgas 8 = fechaLlenado + 64 horas, solo del turno actual
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
    .filter(e => e.fechaPurga8 && e.fechaPurga8 >= inicioTurno && e.fechaPurga8 <= finTurno)
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
            sub="Registros Activos"
            color="text-amber-600"
            bg="bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200"
          />
          <KpiCard
            label="Chequeos 72h Pendientes"
            value={pendientes72}
            icon={Clock}
            sub="Por realizar"
            color="text-sky-600"
            bg="bg-gradient-to-br from-sky-100 to-sky-50 border border-sky-200"
          />
          <KpiCard
            label="Chequeos 72h Completados"
            value={completados72}
            icon={CheckCircle2}
            sub="Confirmados"
            color="text-emerald-600"
            bg="bg-gradient-to-br from-emerald-100 to-emerald-50 border border-emerald-200"
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
                <div className="flex flex-col gap-1 p-2">
                  {proximos24.map((ext) => (
                    <Link to="/extracto" search={{ tanque: ext.tanque }} key={ext.id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 border border-transparent hover:border-border/50 transition-all cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-sky-100 to-sky-50 border border-sky-100 flex items-center justify-center shrink-0 shadow-sm">
                          <Database className="h-4 w-4 text-sky-600" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-foreground tracking-tight">Tanque {ext.tanque}</p>
                          <p className="text-[11px] font-semibold text-muted-foreground mt-0.5 capitalize">{ext.marca}</p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <span className="px-2.5 py-1 bg-sky-100/80 text-sky-700 rounded-md font-bold text-xs shadow-sm border border-sky-200/50">
                          {format(ext.parsedH24!, "HH:mm")}
                        </span>
                        <p className="text-[10px] text-muted-foreground/80 mt-1 font-bold">
                          {format(ext.parsedH24!, "d MMM", { locale: es })}
                        </p>
                      </div>
                    </Link>
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
                <div className="flex flex-col gap-1 p-2">
                  {proximos72.map((ext) => (
                    <Link to="/extracto72" search={{ tanque: ext.tanque }} key={ext.id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 border border-transparent hover:border-border/50 transition-all cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 shadow-sm">
                          <Database className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-foreground tracking-tight">Tanque {ext.tanque}</p>
                          <p className="text-[11px] font-semibold text-muted-foreground mt-0.5 capitalize">{ext.marca}</p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <span className="px-2.5 py-1 bg-indigo-100/80 text-indigo-700 rounded-md font-bold text-xs shadow-sm border border-indigo-200/50">
                          {format(ext.parsedH72!, "HH:mm")}
                        </span>
                        <p className="text-[10px] text-muted-foreground/80 mt-1 font-bold">
                          {format(ext.parsedH72!, "d MMM", { locale: es })}
                        </p>
                      </div>
                    </Link>
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
                <div className="flex flex-col gap-1 p-2">
                  {proximasPurgas.map((p) => (
                    <Link to="/purgas" search={{ tanque: p.tanque }} key={p.id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 border border-transparent hover:border-border/50 transition-all cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-rose-100 to-rose-50 border border-rose-100 flex items-center justify-center shrink-0 shadow-sm">
                          <Droplets className="h-4 w-4 text-rose-600" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-foreground tracking-tight">Tanque {p.tanque}</p>
                          <p className="text-[11px] font-semibold text-muted-foreground mt-0.5 capitalize">{p.marca}</p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <span className="px-2.5 py-1 bg-rose-100/80 text-rose-700 rounded-md font-bold text-xs shadow-sm border border-rose-200/50">
                          {format(p.fechaPurga8!, "HH:mm")}
                        </span>
                        <p className="text-[10px] text-muted-foreground/80 mt-1 font-bold">
                          {format(p.fechaPurga8!, "d MMM", { locale: es })}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Chart row */}
      <div className="grid gap-5 mt-5">
        <Card className="border-border shadow-sm hover:shadow-lg transition-all duration-300 group">
          <CardHeader className="py-4 px-5 border-b border-border/50 bg-muted/20">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2 cursor-pointer" onClick={() => setTipoGrafica(tipoGrafica === "marca" ? "mes" : "marca")}>
                  <TrendingUp className="h-4 w-4 text-primary" />
                  {tipoGrafica === "marca" ? "Distribución por Marca" : "Distribución por Meses"}
                </CardTitle>
                
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








