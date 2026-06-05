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
import { usePositions } from "@/hooks/usePositions";
import { Position } from "@/types";

interface PositionFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    position?: Position | null;
    onSuccess?: () => void;
}

export function PositionFormModal({ open, onOpenChange, position, onSuccess }: PositionFormModalProps) {
    const { createPosition, updatePosition } = usePositions();

    const [formData, setFormData] = useState({
        title: "",
        isActive: true,
    });

    useEffect(() => {
        if (open) {
            setFormData({
                title: position?.title || "",
                isActive: position?.isActive ?? true,
            });
        }
    }, [open, position]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (position) {
                await updatePosition.mutateAsync({
                    id: position.id,
                    data: formData,
                });
            } else {
                await createPosition.mutateAsync(formData);
            }

            onOpenChange(false);
            onSuccess?.();
            setFormData({ title: "", isActive: true });
        } catch (error: any) {
            toast.error(error?.message || "Ошибка при сохранении");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]" aria-describedby={undefined}>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{position ? "Редактировать должность" : "Добавить должность"}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Название должности</Label>
                            <Input
                                id="title"
                                placeholder="Менеджер"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="isActive">Активна</Label>
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
                        <Button type="submit" disabled={createPosition.isPending || updatePosition.isPending}>
                            {position ? "Сохранить" : "Добавить"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
