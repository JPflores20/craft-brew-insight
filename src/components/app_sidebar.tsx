import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Calendar, Beaker, ClipboardList, CalendarDays, Clock } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard",              url: "/",           icon: Home          },
  { title: "Agenda",                 url: "/agenda",     icon: Calendar      },
  { title: "Chequeo Plato (72 Hrs)", url: "/extracto72", icon: Clock         },
  { title: "Extractos (144 Hrs)",    url: "/extracto",   icon: Beaker        },
  { title: "Purgas de Trub",         url: "/purgas",     icon: ClipboardList },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-200/50 shadow-sm overflow-hidden bg-white/70 backdrop-blur-xl">
      {/* Brand */}
      <SidebarHeader className="border-b border-slate-100 bg-transparent pt-6 pb-5 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:pt-6 group-data-[collapsible=icon]:pb-5">
        <div className="flex items-center justify-center md:justify-start gap-3 px-3 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-md shadow-amber-500/20 transition-transform duration-300 hover:scale-105 group group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8">
            <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CalendarDays className="h-5 w-5 text-white drop-shadow-sm" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight overflow-hidden animate-fade-in group-data-[collapsible=icon]:hidden">
              <span className="text-[15px] font-black text-slate-800 tracking-tight whitespace-nowrap">
                Elaboración
              </span>
              <span className="text-xs font-medium text-slate-500 mt-0.5 whitespace-nowrap">Control Operativo</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-transparent px-3 py-6 group-data-[collapsible=icon]:px-0">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[11px] uppercase tracking-[0.2em] text-slate-400 font-bold px-2 pb-3 group-data-[collapsible=icon]:hidden">
              Navegación General
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {items.map((item) => {
                const active = path === item.url;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className={`
                        group relative h-11 w-full rounded-xl transition-all duration-300 ease-out overflow-hidden group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:mx-auto
                        ${active
                          ? "bg-amber-50 shadow-sm ring-1 ring-amber-100/50"
                          : "hover:bg-slate-50 hover:shadow-sm"
                        }
                      `}
                    >
                      <Link to={item.url} className="flex items-center gap-3 px-3 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center z-10 w-full h-full">
                        {/* Indicador de activo */}
                        {active && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-amber-500 rounded-r-full shadow-sm group-data-[collapsible=icon]:hidden" />
                        )}
                        
                        <div className={`
                          flex items-center justify-center transition-all duration-300 shrink-0
                          ${active ? "text-amber-600 scale-110" : "text-slate-400 group-hover:text-slate-700 group-hover:scale-110"}
                        `}>
                          <item.icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.5 : 2} />
                        </div>
                        
                        <span className={`
                          text-sm transition-colors duration-300 font-medium whitespace-nowrap group-data-[collapsible=icon]:hidden
                          ${active ? "text-amber-900 font-bold" : "text-slate-600 group-hover:text-slate-900"}
                        `}>
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-transparent border-t border-slate-100 p-4 relative overflow-hidden group-data-[collapsible=icon]:hidden">
        {!collapsed && (
          <div className="flex flex-col items-center justify-center gap-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] whitespace-nowrap">
              Zacatecas
            </p>
            <div className="h-0.5 w-8 rounded-full bg-slate-200" />
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}