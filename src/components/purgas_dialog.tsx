import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type PurgaRow, type AnalisisVisual } from "@/data/purgas";
import { Dispatch, SetStateAction } from "react";

interface PurgasDialogProps {
  open: boolean;
  set_open: Dispatch<SetStateAction<boolean>>;
  form: { tanque: string; numero: string; hora: string; analisis: Exclude<AnalisisVisual, null> };
  set_form: Dispatch<SetStateAction<{ tanque: string; numero: string; hora: string; analisis: Exclude<AnalisisVisual, null> }>>;
  rows: PurgaRow[];
  submit: () => void;
}

export function PurgasDialog({ open, set_open, form, set_form, rows, submit }: PurgasDialogProps) {
  return (
    <Dialog open={open} onOpenChange={set_open}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Registrar Nueva Purga</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Registrar purga</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Tanque</Label>
            <Select value={form.tanque} onValueChange={(v) => set_form({ ...form, tanque: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-64">
                {rows.map((r) => <SelectItem key={r.tanque} value={r.tanque}>{r.tanque}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Nº de purga (1-10)</Label>
            <Input type="number" min={1} max={10} value={form.numero} onChange={(e) => set_form({ ...form, numero: e.target.value })} />
          </div>
          <div>
            <Label>Hora</Label>
            <Input type="time" value={form.hora} onChange={(e) => set_form({ ...form, hora: e.target.value })} />
          </div>
          <div>
            <Label>Análisis visual</Label>
            <Select value={form.analisis} onValueChange={(v) => set_form({ ...form, analisis: v as Exclude<AnalisisVisual, null> })}>
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
          <Button variant="outline" onClick={() => set_open(false)}>Cancelar</Button>
          <Button onClick={submit}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
