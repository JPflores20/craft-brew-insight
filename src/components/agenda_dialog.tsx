import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type EventType } from "@/data/agenda";
import { Dispatch, SetStateAction } from "react";

interface AgendaDialogProps {
  open: boolean;
  set_open: Dispatch<SetStateAction<boolean>>;
  form: { titulo: string; inicio: string; fin: string; tipo: EventType; descripcion: string };
  set_form: Dispatch<SetStateAction<{ titulo: string; inicio: string; fin: string; tipo: EventType; descripcion: string }>>;
  submit: () => void;
}

export function AgendaDialog({ open, set_open, form, set_form, submit }: AgendaDialogProps) {
  return (
    <Dialog open={open} onOpenChange={set_open}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo Evento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear nuevo evento</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Título</Label>
            <Input value={form.titulo} onChange={(e) => set_form({ ...form, titulo: e.target.value })} placeholder="Ej: Mantenimiento TK-110" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Fecha inicio</Label>
              <Input type="datetime-local" value={form.inicio} onChange={(e) => set_form({ ...form, inicio: e.target.value })} />
            </div>
            <div>
              <Label>Fecha fin</Label>
              <Input type="datetime-local" value={form.fin} onChange={(e) => set_form({ ...form, fin: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Tipo de evento</Label>
            <Select value={form.tipo} onValueChange={(v) => set_form({ ...form, tipo: v as EventType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Turno">Turno</SelectItem>
                <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                <SelectItem value="CIP">Limpieza CIP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Descripción</Label>
            <Textarea value={form.descripcion} onChange={(e) => set_form({ ...form, descripcion: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => set_open(false)}>Cancelar</Button>
          <Button onClick={submit}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
