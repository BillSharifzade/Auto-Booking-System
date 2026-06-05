import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, User, Phone, Settings, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DriverFormModal } from "@/components/drivers/DriverFormModal";
import { useDrivers } from "@/hooks/useDrivers";
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

export default function Drivers() {
  const [showForm, setShowForm] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { drivers, isLoading, deleteDriver } = useDrivers();

  const handleEdit = (driver: any) => {
    setSelectedDriver(driver);
    setShowForm(true);
  };

  const handleCreate = () => {
    setSelectedDriver(null);
    setShowForm(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      deleteDriver.mutate(deleteId);
      setDeleteId(null);
    }
  };

  if (isLoading) return <div className="p-6">Загрузка...</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Водители</h1>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Добавить водителя
          </Button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drivers.map((driver: any) => (
            <Card key={driver.id} className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{driver.fullName}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {driver.phone}
                    </div>
                  </div>
                </div>
                <Badge variant={driver.status === 'active' ? 'default' : 'secondary'}>
                  {driver.status === 'active' ? 'Активен' : 'Неактивен'}
                </Badge>
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => handleEdit(driver)}
                >
                  <Settings className="h-4 w-4" />
                  Изменить
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDeleteClick(driver.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <DriverFormModal
        open={showForm}
        onOpenChange={setShowForm}
        driver={selectedDriver}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтвердите удаление</AlertDialogTitle>
            <AlertDialogDescription>
              Вы действительно хотите удалить этого водителя? Это действие нельзя отменить.
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
