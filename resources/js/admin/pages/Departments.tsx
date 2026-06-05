import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Building2, Settings, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DepartmentFormModal } from "@/components/departments/DepartmentFormModal";
import { useDepartments } from "@/hooks/useDepartments";
import { Department } from "@/types";
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

export default function Departments() {
    const [showForm, setShowForm] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const { departments, isLoading, deleteDepartment } = useDepartments();

    const handleEdit = (department: Department) => {
        setSelectedDepartment(department);
        setShowForm(true);
    };

    const handleCreate = () => {
        setSelectedDepartment(null);
        setShowForm(true);
    };

    const handleDeleteClick = (id: string) => {
        setDeleteId(id);
    };

    const handleConfirmDelete = () => {
        if (deleteId) {
            deleteDepartment.mutate(deleteId);
            setDeleteId(null);
        }
    };

    if (isLoading) return <div className="p-6">Загрузка...</div>;

    return (
        <div className="h-full flex flex-col">
            <div className="border-b border-border bg-card px-6 py-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-foreground">Отделы</h1>
                    <Button onClick={handleCreate} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Добавить отдел
                    </Button>
                </div>
            </div>

            <div className="flex-1 p-6 overflow-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {departments.map((department) => (
                        <Card key={department.id} className="p-4">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        <Building2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{department.shortName}</h3>
                                        <p className="text-sm text-muted-foreground">{department.fullName}</p>
                                    </div>
                                </div>
                                <Badge variant={department.isActive ? 'default' : 'secondary'}>
                                    {department.isActive ? 'Активен' : 'Неактивен'}
                                </Badge>
                            </div>

                            <div className="flex gap-2 mt-4">
                                <Button
                                    variant="outline"
                                    className="flex-1 gap-2"
                                    onClick={() => handleEdit(department)}
                                >
                                    <Settings className="h-4 w-4" />
                                    Изменить
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteClick(department.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>

                {departments.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Нет отделов</p>
                        <p className="text-sm">Создайте первый отдел, нажав кнопку выше</p>
                    </div>
                )}
            </div>

            <DepartmentFormModal
                open={showForm}
                onOpenChange={setShowForm}
                department={selectedDepartment}
            />

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Подтвердите удаление</AlertDialogTitle>
                        <AlertDialogDescription>
                            Вы действительно хотите удалить этот отдел? Это действие нельзя отменить.
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
