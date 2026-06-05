import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TypeFormModal } from "@/components/types/TypeFormModal";
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
import { toast } from "sonner";
import { useRequestTypes } from "@/hooks/useRequestTypes";
import { RequestType } from "@/types";

const Types = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState<RequestType | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<RequestType | null>(null);

  const { requestTypes, isLoading, deleteRequestType } = useRequestTypes();

  const getPriorityBadge = (priority: number) => {
    const variants = {
      1: { label: 'Высокий', className: 'bg-destructive text-destructive-foreground' },
      2: { label: 'Средний', className: 'bg-warning text-warning-foreground' },
      3: { label: 'Низкий', className: 'bg-muted text-muted-foreground' },
      4: { label: 'Обычный', className: 'bg-secondary text-secondary-foreground' },
    };
    const variant = variants[priority as keyof typeof variants] || variants[4];
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const handleDelete = async () => {
    if (confirmDelete) {
      try {
        await deleteRequestType.mutateAsync(confirmDelete.id);
        toast.success("Тип заявки удален");
      } catch (error) {
        toast.error("Ошибка при удалении");
      }
      setConfirmDelete(null);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Типы заявок</h1>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Добавить тип
          </Button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        <Card>
          <Table>
            <TableHeader className="bg-sidebar">
              <TableRow>
                <TableHead className="text-sidebar-foreground">Название</TableHead>
                <TableHead className="text-sidebar-foreground">Приоритет</TableHead>
                <TableHead className="text-sidebar-foreground">Привязанное авто</TableHead>
                <TableHead className="text-sidebar-foreground text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    Загрузка...
                  </TableCell>
                </TableRow>
              ) : requestTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Нет типов заявок
                  </TableCell>
                </TableRow>
              ) : (
                requestTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell>{getPriorityBadge(type.priority)}</TableCell>
                    <TableCell>{type.carName || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => { setEditingType(type); setShowForm(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="outline" className="h-8 w-8 border-destructive text-destructive" onClick={() => setConfirmDelete(type)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <TypeFormModal
        open={showForm}
        onOpenChange={(open) => { if (!open) setEditingType(null); setShowForm(open); }}
        typeData={editingType}
        onSuccess={() => {
          toast.success(editingType ? "Тип заявки обновлен" : "Тип заявки создан");
        }}
      />

      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить тип заявки?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Types;
