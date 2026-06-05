import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Vehicle, VehicleStatus } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useVehicles } from "@/hooks/useVehicles";

const vehicleFormSchema = z.object({
  model: z.string().min(1, {
    message: "Модель обязательна для заполнения.",
  }),
  licensePlate: z.string().min(3, {
    message: "Госномер должен содержать минимум 3 символа.",
  }),
  color: z.string().optional(),
  status: z.enum(["available", "in_use", "maintenance", "out_of_service"] as const),
});

type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

interface CarFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  car?: Vehicle;
  onSuccess?: () => void;
}

const statusLabels: Record<VehicleStatus, string> = {
  available: "Доступна",
  in_use: "В рейсе",
  maintenance: "На обслуживании",
  out_of_service: "Неисправна",
};

export function CarFormModal({
  open,
  onOpenChange,
  car,
  onSuccess,
}: CarFormModalProps) {
  const { createVehicle, updateVehicle, isLoading } = useVehicles(undefined, { enabled: open });

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema) as any,
    defaultValues: {
      model: "",
      licensePlate: "",
      color: "",
      status: "available" as const,
    },
  });

  useEffect(() => {
    if (car) {
      form.reset({
        model: car.model || "",
        licensePlate: car.licensePlate || "",
        color: car.color || "",
        status: (car.status as VehicleStatus) || "available",
      });
    } else if (open) {
      form.reset({
        model: "",
        licensePlate: "",
        color: "",
        status: "available" as const,
      });
    }
  }, [car, open, form]);

  const handleSubmit = async (formData: VehicleFormValues) => {
    try {
      if (car) {
        await updateVehicle.mutateAsync({
          id: car.id,
          data: formData,
        });
      } else {
        await createVehicle.mutateAsync(formData as any);
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error saving vehicle:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" aria-describedby={undefined}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>
                {car ? "Редактировать автомобиль" : "Добавить автомобиль"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Марка и Модель</FormLabel>
                      <FormControl>
                        <Input placeholder="Toyota Camry" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Цвет</FormLabel>
                      <FormControl>
                        <Input placeholder="Белый" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="licensePlate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Госномер</FormLabel>
                    <FormControl>
                      <Input placeholder="А123ВС777" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Статус</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите статус" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {car ? "Сохранить" : "Добавить"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
