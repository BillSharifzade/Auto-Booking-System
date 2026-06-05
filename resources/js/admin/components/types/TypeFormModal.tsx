import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { useRequestTypes } from "@/hooks/useRequestTypes";
import { useVehicles } from "@/hooks/useVehicles";
import { RequestType } from "@/types";
import { Loader2 } from "lucide-react";

const typeFormSchema = z.object({
  name: z.string().min(2, {
    message: "Название должно содержать минимум 2 символа.",
  }),
  priority: z.coerce.number().min(1).max(20),
  carId: z.string().min(1, { message: "Выберите автомобиль" }),
});

type TypeFormValues = z.infer<typeof typeFormSchema>;

interface TypeFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  typeData?: RequestType | null;
  onSuccess?: () => void;
}

export function TypeFormModal({ open, onOpenChange, typeData, onSuccess }: TypeFormModalProps) {
  const { createRequestType, updateRequestType } = useRequestTypes(undefined, { enabled: open });
  const { vehicles, isLoading: isLoadingVehicles } = useVehicles(undefined, { enabled: open });

  const form = useForm<TypeFormValues>({
    resolver: zodResolver(typeFormSchema) as any,
    defaultValues: {
      name: "",
      priority: 4,
      carId: "",
    },
  });

  useEffect(() => {
    if (typeData) {
      form.reset({
        name: typeData.name, // This is actually 'title' from backend mapped to 'name' in formatRequestType
        priority: typeData.priority,
        carId: typeData.carId || "",
      });
    } else if (open) {
      form.reset({
        name: "",
        priority: 4,
        carId: "",
      });
    }
  }, [typeData, open, form]);

  const handleSubmit = async (formData: TypeFormValues) => {
    try {
      const payload = {
        title: formData.name,
        priority: formData.priority,
        carId: formData.carId,
      };

      if (typeData) {
        await updateRequestType.mutateAsync({
          id: typeData.id,
          data: payload,
        });
      } else {
        await createRequestType.mutateAsync(payload as any);
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error saving request type:", error);
    }
  };

  const isLoading = createRequestType.isPending || updateRequestType.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" aria-describedby={undefined}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>
                {typeData ? "Редактировать тип заявки" : "Добавить тип заявки"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Название</FormLabel>
                    <FormControl>
                      <Input placeholder="Например: VIP Клиент" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Приоритет</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(Number(val))}
                      value={String(field.value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">Высокий</SelectItem>
                        <SelectItem value="2">Средний</SelectItem>
                        <SelectItem value="3">Низкий</SelectItem>
                        <SelectItem value="4">Обычный</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="carId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Привязанное авто</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoadingVehicles}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите автомобиль" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vehicles.map((car) => (
                          <SelectItem key={car.id} value={car.id}>
                            {car.model} ({car.licensePlate})
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
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {typeData ? "Сохранить" : "Добавить"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
