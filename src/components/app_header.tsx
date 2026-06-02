import { useEffect, useState } from "react";
import { Search, Bell } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-card px-4 shadow-sm">
      <SidebarTrigger className="text-foreground" />
      <div className="hidden md:flex flex-col leading-tight">
        <span className="text-sm font-medium capitalize">
          {format(now, "EEEE d 'de' MMMM", { locale: es })}
        </span>
        <span className="text-xs text-muted-foreground">
          {format(now, "HH:mm")} hrs
        </span>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar tanque, marca, evento..."
            className="w-72 pl-9 bg-background"
          />
        </div>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
        </Button>
        <Avatar className="h-9 w-9 border-2 border-primary/30">
          <AvatarFallback className="bg-sidebar text-sidebar-foreground text-xs font-semibold">
            JM
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}