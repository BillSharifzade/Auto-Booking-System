import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVehicles } from "@/hooks/useVehicles";
import { toast } from "sonner";

interface ForceMajorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ForceMajorModal({ open, onOpenChange }: ForceMajorModalProps) {
  const { vehicles, createForceBlock } = useVehicles();
  const [formData, setFormData] = useState({
    carId: "",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createForceBlock.mutateAsync({
        carId: formData.carId,
        startTime: formData.startDate,
        endTime: formData.endDate,
        reason: formData.reason,
      });
      toast.success("Блокировка создана");
      onOpenChange(false);
      setFormData({ carId: "", startDate: "", endDate: "", reason: "" });
    } catch (error) {
      toast.error("Ошибка при создании блокировки");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" aria-describedby={undefined}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Создать блокировку (Форс-мажор)</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="car">Автомобиль</Label>
              <Select
                value={formData.carId}
                onValueChange={(value) => setFormData({ ...formData, carId: value })}
                required
              >
                <SelectTrigger id="car">
                  <SelectValue placeholder="Выберите автомобиль" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((car) => (
                    <SelectItem key={car.id} value={car.id}>
                      {car.model} ({car.licensePlate})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Дата и время начала</Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Дата и время окончания</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Причина</Label>
              <Textarea
                id="reason"
                placeholder="Опишите причину блокировки..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                required
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit">Создать блокировку</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
