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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useDepartments } from "@/hooks/useDepartments";
import { Department } from "@/types";

interface DepartmentFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    department?: Department | null;
    onSuccess?: () => void;
}

export function DepartmentFormModal({ open, onOpenChange, department, onSuccess }: DepartmentFormModalProps) {
    const { createDepartment, updateDepartment } = useDepartments();

    const [formData, setFormData] = useState({
        shortName: "",
        fullName: "",
        isActive: true,
    });

    useEffect(() => {
        if (open) {
            setFormData({
                shortName: department?.shortName || "",
                fullName: department?.fullName || "",
                isActive: department?.isActive ?? true,
            });
        }
    }, [open, department]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (department) {
                await updateDepartment.mutateAsync({
                    id: department.id,
                    data: formData,
                });
            } else {
                await createDepartment.mutateAsync(formData);
            }

            onOpenChange(false);
            onSuccess?.();
            setFormData({ shortName: "", fullName: "", isActive: true });
        } catch (error: any) {
            toast.error(error?.message || "Ошибка при сохранении");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]" aria-describedby={undefined}>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{department ? "Редактировать отдел" : "Добавить отдел"}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="shortName">Краткое название</Label>
                            <Input
                                id="shortName"
                                placeholder="ИТ"
                                value={formData.shortName}
                                onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                                required
                                maxLength={50}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="fullName">Полное название</Label>
                            <Input
                                id="fullName"
                                placeholder="Информационные технологии"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                required
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="isActive">Активен</Label>
                            <Switch
                                id="isActive"
                                checked={formData.isActive}
                                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Отмена
                        </Button>
                        <Button type="submit" disabled={createDepartment.isPending || updateDepartment.isPending}>
                            {department ? "Сохранить" : "Добавить"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
