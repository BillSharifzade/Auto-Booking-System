import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Shield, Settings, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AdminFormModal } from "@/components/admins/AdminFormModal";
import { useAdmins } from "@/hooks/useAdmins";
import { useAuth } from "@/context/AuthContext";
import { AdminAccount } from "@/api/adminAccountService";
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

export default function Admins() {
    const [showForm, setShowForm] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState<AdminAccount | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const { admins, isLoading, deleteAdmin } = useAdmins();
    const { user: currentUser } = useAuth();

    const handleEdit = (admin: AdminAccount) => {
        setSelectedAdmin(admin);
        setShowForm(true);
    };

    const handleCreate = () => {
        setSelectedAdmin(null);
        setShowForm(true);
    };

    const handleConfirmDelete = () => {
        if (deleteId) {
            deleteAdmin.mutate(deleteId, {
                onSuccess: () => toast.success("Администратор удалён"),
                onError: (error: any) =>
                    toast.error(error?.data?.error || "Ошибка при удалении"),
            });
            setDeleteId(null);
        }
    };

    if (isLoading) return <div className="p-6">Загрузка...</div>;

    return (
        <div className="h-full flex flex-col">
            <div className="border-b border-border bg-card px-6 py-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-foreground">Администраторы</h1>
                    <Button onClick={handleCreate} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Добавить администратора
                    </Button>
                </div>
            </div>

            <div className="flex-1 p-6 overflow-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {admins.map((admin) => {
                        const isSelf = admin.id === currentUser.id;
                        return (
                            <Card key={admin.id} className="p-4">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                            <Shield className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{admin.name}</h3>
                                            <p className="text-sm text-muted-foreground">{admin.email}</p>
                                        </div>
                                    </div>
                                    {isSelf && <Badge>Это вы</Badge>}
                                </div>

                                <div className="flex gap-2 mt-4">
                                    <Button
                                        variant="outline"
                                        className="flex-1 gap-2"
                                        onClick={() => handleEdit(admin)}
                                    >
                                        <Settings className="h-4 w-4" />
                                        Изменить
                                    </Button>
                                    {!isSelf && (
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => setDeleteId(admin.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>

                {admins.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Нет администраторов</p>
                    </div>
                )}
            </div>

            <AdminFormModal
                open={showForm}
                onOpenChange={setShowForm}
                admin={selectedAdmin}
            />

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Подтвердите удаление</AlertDialogTitle>
                        <AlertDialogDescription>
                            Этот администратор потеряет доступ к панели управления. Это действие нельзя отменить.
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
