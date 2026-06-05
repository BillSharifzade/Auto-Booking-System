import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useDrivers } from "@/hooks/useDrivers";
import { useVehicles } from "@/hooks/useVehicles";

interface DriverFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driver?: any;
  onSuccess?: () => void;
}

export function DriverFormModal({ open, onOpenChange, driver, onSuccess }: DriverFormModalProps) {
  const { createDriver, updateDriver } = useDrivers();
  const { vehicles, assignDriver } = useVehicles();

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    telegramId: "",
    assignedCarId: "none",
  });

  useEffect(() => {
    if (open) {
      // Find car assigned to this driver
      const assignedCar = vehicles.find(v => v.driverId === driver?.id);

      setFormData({
        fullName: driver?.fullName || "",
        phone: driver?.phone || "",
        telegramId: driver?.telegramId || "",
        assignedCarId: assignedCar?.id || "none",
      });
    }
  }, [open, driver, vehicles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let driverId = driver?.id;

      if (driver) {
        await updateDriver.mutateAsync({
          id: driver.id,
          data: {
            fullName: formData.fullName,
            phone: formData.phone,
            telegramId: formData.telegramId ? Number(formData.telegramId) : undefined, // Assuming telegramId is number in backend
          }
        });
        toast.success("Водитель обновлен");
      } else {
        const newDriver = await createDriver.mutateAsync({
          name: formData.fullName, // Backend expects name
          fullName: formData.fullName,
          phone: formData.phone,
          telegramId: formData.telegramId ? Number(formData.telegramId) : undefined,
          status: 'active'
        });
        driverId = newDriver.id; // Adjust based on response structure
        toast.success("Водитель добавлен");
      }

      // Handle car assignment
      if (formData.assignedCarId !== "none") {
        await assignDriver.mutateAsync({
          vehicleId: formData.assignedCarId,
          driverId: driverId
        });
      } else if (driver) {
        // If unassigning (and we knew previous car), we might need to handle it.
        // But assignDriver with null driverId is supported?
        // Let's check if we changed assignment
        const previousCar = vehicles.find(v => v.driverId === driver.id);
        if (previousCar && previousCar.id !== formData.assignedCarId) {
          await assignDriver.mutateAsync({
            vehicleId: previousCar.id,
            driverId: null
          });
        }
      }

      onOpenChange(false);
      onSuccess?.();
      setFormData({ fullName: "", phone: "", telegramId: "", assignedCarId: "none" });
    } catch (error: any) {
      toast.error(error?.message || "Ошибка при сохранении");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" aria-describedby={undefined}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{driver ? "Редактировать водителя" : "Добавить водителя"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">ФИО</Label>
              <Input
                id="fullName"
                placeholder="Иванов Иван Иванович"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Телефон</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+7 (999) 123-45-67"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telegramId">Telegram ID</Label>
              <Input
                id="telegramId"
                placeholder="123456789"
                value={formData.telegramId}
                onChange={(e) => setFormData({ ...formData, telegramId: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="car">Привязанная машина</Label>
              <Select
                value={formData.assignedCarId}
                onValueChange={(value) => setFormData({ ...formData, assignedCarId: value })}
              >
                <SelectTrigger id="car">
                  <SelectValue placeholder="Выберите автомобиль" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без привязки</SelectItem>
                  {vehicles.map((car) => (
                    <SelectItem key={car.id} value={car.id}>
                      {car.model} ({car.licensePlate})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={createDriver.isPending || updateDriver.isPending}>
              {driver ? "Сохранить" : "Добавить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
