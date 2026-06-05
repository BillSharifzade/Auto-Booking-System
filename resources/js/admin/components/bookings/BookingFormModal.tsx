import { useState, useMemo } from "react";
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
import { useBookings } from "@/hooks/useBookings";
import { useRequestTypes } from "@/hooks/useRequestTypes";
import { useVehicles } from "@/hooks/useVehicles";
import { useDrivers } from "@/hooks/useDrivers";
import { useDepartments } from "@/hooks/useDepartments";
import { usePositions } from "@/hooks/usePositions";

interface BookingFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingFormModal({ open, onOpenChange }: BookingFormModalProps) {
  const { createBooking } = useBookings(undefined, { enabled: false });
  const { requestTypes } = useRequestTypes();
  const { vehicles } = useVehicles();
  const { drivers } = useDrivers();
  const { departments } = useDepartments();
  const { positions } = usePositions();

  const [formData, setFormData] = useState({
    requestTypeId: "",
    vehicleId: "",
    driverId: "",
    departmentId: "",
    positionId: "",
    datetimeFrom: "",
    datetimeTo: "",
    hasLuggage: false,
    passengerCount: 1,
    isWaitMode: false,
    clientName: "",
    fromLocation: "",
    toLocation: "",
    comment: "",
  });

  const selectedType = useMemo(
    () => requestTypes.find((t) => t.id === formData.requestTypeId),
    [formData.requestTypeId, requestTypes]
  );

  const defaultVehicleId = selectedType?.carId || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const vehicleId = formData.vehicleId || defaultVehicleId;
    if (!formData.requestTypeId || !vehicleId || !formData.datetimeFrom || !formData.datetimeTo) {
      toast.error("Заполните обязательные поля");
      return;
    }

    try {
      await createBooking.mutateAsync({
        requestTypeId: formData.requestTypeId,
        vehicleId,
        driverId: formData.driverId || undefined,
        departmentId: formData.departmentId || undefined,
        positionId: formData.positionId || undefined,
        datetimeFrom: new Date(formData.datetimeFrom).toISOString(),
        datetimeTo: new Date(formData.datetimeTo).toISOString(),
        hasLuggage: formData.hasLuggage,
        passengerCount: formData.passengerCount,
        isWaitMode: formData.isWaitMode,
        clientName: formData.clientName || undefined,
        fromLocation: formData.fromLocation || undefined,
        toLocation: formData.toLocation || undefined,
        comment: formData.comment || undefined,
      });
      toast.success("Бронь создана");
      onOpenChange(false);
      setFormData({
        requestTypeId: "",
        vehicleId: "",
        driverId: "",
        departmentId: "",
        positionId: "",
        datetimeFrom: "",
        datetimeTo: "",
        hasLuggage: false,
        passengerCount: 1,
        isWaitMode: false,
        clientName: "",
        fromLocation: "",
        toLocation: "",
        comment: "",
      });
    } catch (err: any) {
      toast.error(err?.message || "Не удалось создать бронь");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]" aria-describedby={undefined}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Создать бронь</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type">Тип заявки</Label>
              <Select
                value={formData.requestTypeId}
                onValueChange={(value) => setFormData({ ...formData, requestTypeId: value })}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Выберите тип заявки" />
                </SelectTrigger>
                <SelectContent>
                  {requestTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title || t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Отдел</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
                >
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Выберите отдел" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Не указан</SelectItem>
                    {departments.filter(d => d.isActive).map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.shortName} — {d.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Должность</Label>
                <Select
                  value={formData.positionId}
                  onValueChange={(value) => setFormData({ ...formData, positionId: value })}
                >
                  <SelectTrigger id="position">
                    <SelectValue placeholder="Выберите должность" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Не указана</SelectItem>
                    {positions.filter(p => p.isActive).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle">Автомобиль</Label>
                <Select
                  value={formData.vehicleId || defaultVehicleId}
                  onValueChange={(value) => setFormData({ ...formData, vehicleId: value })}
                >
                  <SelectTrigger id="vehicle">
                    <SelectValue placeholder="Выберите автомобиль" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.model} ({c.licensePlate})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="driver">Водитель</Label>
                <Select
                  value={formData.driverId}
                  onValueChange={(value) => setFormData({ ...formData, driverId: value })}
                >
                  <SelectTrigger id="driver">
                    <SelectValue placeholder="Выберите водителя (опционально)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Без водителя</SelectItem>
                    {drivers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from">Начало</Label>
                <Input
                  id="from"
                  type="datetime-local"
                  value={formData.datetimeFrom}
                  onChange={(e) => setFormData({ ...formData, datetimeFrom: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="to">Окончание</Label>
                <Input
                  id="to"
                  type="datetime-local"
                  value={formData.datetimeTo}
                  onChange={(e) => setFormData({ ...formData, datetimeTo: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="passengers">Пассажиры</Label>
                <Input
                  id="passengers"
                  type="number"
                  min={0}
                  value={formData.passengerCount}
                  onChange={(e) => setFormData({ ...formData, passengerCount: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="luggage">Багаж (да/нет)</Label>
                <Select
                  value={formData.hasLuggage ? "yes" : "no"}
                  onValueChange={(v) => setFormData({ ...formData, hasLuggage: v === 'yes' })}
                >
                  <SelectTrigger id="luggage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">Нет</SelectItem>
                    <SelectItem value="yes">Да</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="wait">Режим ожидания</Label>
                <Select
                  value={formData.isWaitMode ? "wait" : "return"}
                  onValueChange={(v) => setFormData({ ...formData, isWaitMode: v === 'wait' })}
                >
                  <SelectTrigger id="wait">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wait">Водитель ожидает</SelectItem>
                    <SelectItem value="return">Возврат по времени</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client">Клиент (имя)</Label>
                <Input
                  id="client"
                  placeholder="Имя клиента"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fromLocation">Откуда</Label>
                  <Input
                    id="fromLocation"
                    placeholder="Напр. Офис"
                    value={formData.fromLocation}
                    onChange={(e) => setFormData({ ...formData, fromLocation: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="toLocation">Куда</Label>
                  <Input
                    id="toLocation"
                    placeholder="Напр. Аэропорт"
                    value={formData.toLocation}
                    onChange={(e) => setFormData({ ...formData, toLocation: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment">Комментарий</Label>
              <Input
                id="comment"
                placeholder="Дополнительная информация"
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={createBooking.isPending}>
              Отмена
            </Button>
            <Button type="submit" disabled={createBooking.isPending}>
              Создать бронь
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
