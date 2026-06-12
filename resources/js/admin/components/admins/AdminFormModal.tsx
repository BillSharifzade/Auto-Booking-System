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
import { toast } from "sonner";
import { useAdmins } from "@/hooks/useAdmins";
import { AdminAccount } from "@/api/adminAccountService";

interface AdminFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    admin?: AdminAccount | null;
}

export function AdminFormModal({ open, onOpenChange, admin }: AdminFormModalProps) {
    const { createAdmin, updateAdmin } = useAdmins();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
    });

    useEffect(() => {
        if (open) {
            setFormData({
                name: admin?.name || "",
                email: admin?.email || "",
                password: "",
            });
        }
    }, [open, admin]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!admin && formData.password.length < 8) {
            toast.error("Пароль должен быть не менее 8 символов");
            return;
        }

        try {
            if (admin) {
                await updateAdmin.mutateAsync({
                    id: admin.id,
                    data: {
                        name: formData.name,
                        email: formData.email,
                        // Empty password means "keep the current one"
                        password: formData.password || undefined,
                    },
                });
                toast.success("Администратор обновлён");
            } else {
                await createAdmin.mutateAsync(formData);
                toast.success("Администратор создан");
            }

            onOpenChange(false);
        } catch (error: any) {
            toast.error(error?.message || "Ошибка при сохранении");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]" aria-describedby={undefined}>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{admin ? "Редактировать администратора" : "Добавить администратора"}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="admin-name">Имя</Label>
                            <Input
                                id="admin-name"
                                placeholder="Иван Иванов"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="admin-email">Email</Label>
                            <Input
                                id="admin-email"
                                type="email"
                                autoComplete="off"
                                placeholder="admin@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="admin-password">
                                {admin ? "Новый пароль (оставьте пустым, чтобы не менять)" : "Пароль"}
                            </Label>
                            <Input
                                id="admin-password"
                                type="password"
                                autoComplete="new-password"
                                placeholder="Минимум 8 символов"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required={!admin}
                                minLength={8}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Отмена
                        </Button>
                        <Button type="submit" disabled={createAdmin.isPending || updateAdmin.isPending}>
                            {admin ? "Сохранить" : "Добавить"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
