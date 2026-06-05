import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Car as CarIcon, Settings, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CarFormModal } from "@/components/cars/CarFormModal";
import { useVehicles } from "@/hooks/useVehicles";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Cars() {
  const [showForm, setShowForm] = useState(false);
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { vehicles: cars, isLoading, deleteVehicle } = useVehicles();

  const handleEdit = (car: any) => {
    setSelectedCar(car);
    setShowForm(true);
  };

  const handleCreate = () => {
    setSelectedCar(null);
    setShowForm(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      deleteVehicle.mutate(deleteId);
      setDeleteId(null);
    }
  };

  if (isLoading) return <div className="p-6">Загрузка...</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Автомобили</h1>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Добавить авто
          </Button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map((car) => (
            <Card key={car.id} className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <CarIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{car.model}</h3>
                    <p className="text-sm text-muted-foreground">{car.licensePlate}</p>
                  </div>
                </div>
                <Badge variant={car.status === 'available' ? 'default' : 'secondary'}>
                  {car.status === 'available' ? 'Свободен' : 'Занят'}
                </Badge>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground mb-4">
                <div className="flex justify-between">
                  <span>Цвет:</span>
                  <span className="text-foreground">{car.color || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Водитель:</span>
                  <span className="text-foreground">{car.driverName || 'Нет'}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => handleEdit(car)}
                >
                  <Settings className="h-4 w-4" />
                  Изменить
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDeleteClick(car.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <CarFormModal
        open={showForm}
        onOpenChange={setShowForm}
        car={selectedCar}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтвердите удаление</AlertDialogTitle>
            <AlertDialogDescription>
              Вы действительно хотите удалить этот автомобиль? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
