import { useEffect, useState } from "react";
import { Bell, Settings } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { obtenerTurnoPorHora } from "@/data/turno";

const TURNO_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  "Turno 1": { label: "Turno 1 · 23:00–05:59", bg: "bg-violet-100", text: "text-violet-700" },
  "Turno 2": { label: "Turno 2 · 06:00–15:29", bg: "bg-sky-100",    text: "text-sky-700"    },
  "Turno 3": { label: "Turno 3 · 15:30–22:59", bg: "bg-amber-100",  text: "text-amber-700"  },
};

export function AppHeader() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const turno = obtenerTurnoPorHora(now.toISOString());
  const tc = turno && TURNO_CONFIG[turno] ? TURNO_CONFIG[turno] : { label: turno ?? "Desconocido", bg: "bg-gray-100", text: "text-gray-600" };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-slate-200/60 bg-white/60 backdrop-blur-lg px-5 shadow-sm transition-all duration-300">
      <SidebarTrigger className="text-slate-400 hover:text-slate-700 transition-colors -ml-1" />

      {/* Date */}
      <div className="hidden md:flex flex-col leading-tight">
        <span className="text-sm font-semibold text-slate-700 tracking-tight first-letter:uppercase">
          {format(now, "EEEE d 'de' MMMM yyyy", { locale: es })}
        </span>
        <span className="text-[11px] text-slate-500 font-medium">
          {format(now, "HH:mm")} hrs
        </span>
      </div>

      {/* Turno badge */}
      <div className="hidden lg:flex items-center ml-2">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold shadow-sm border border-slate-200/50 ${tc.bg} ${tc.text}`}>
          {tc.label}
        </span>
      </div>

      {/* Right */}
      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-colors relative">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-amber-500 shadow-sm border border-white" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-colors">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}