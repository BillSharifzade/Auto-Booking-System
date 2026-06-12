import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Briefcase, Users, Clock, Trash2, Ban } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";
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
import { useState } from "react";
import { useBookings } from "@/hooks/useBookings";

interface BookingListProps {
  selectedDate: Date;
}

const REJECTION_REASONS = [
  'Автомобиль уже занят',
  'Техническое обслуживание',
  'Служебная поездка руководства',
  'Недостаточно времени до выезда',
];

export function BookingList({ selectedDate }: BookingListProps) {
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const [deleteBookingId, setDeleteBookingId] = useState<string | null>(null);
  const [reasonBookingId, setReasonBookingId] = useState<string | null>(null);
  const [reasonType, setReasonType] = useState<'decline' | 'cancel'>('decline');
  const [rejectReason, setRejectReason] = useState('');

  const {
    bookings,
    isLoading,
    approve,
    decline,
    cancel,
    deleteBooking
  } = useBookings({ date: dateStr });

  const handleApprove = (id: string) => {
    approve.mutate(id, {
      onSuccess: () => toast.success("Заявка принята"),
      onError: () => toast.error("Ошибка при принятии заявки")
    });
  };

  const openReasonDialog = (id: string, type: 'decline' | 'cancel') => {
    setReasonBookingId(id);
    setReasonType(type);
    setRejectReason('');
  };

  const confirmReason = () => {
    if (!reasonBookingId) return;
    const reason = rejectReason.trim();
    if (!reason) {
      toast.error("Укажите причину");
      return;
    }

    if (reasonType === 'decline') {
      decline.mutate({ id: reasonBookingId, reason }, {
        onSuccess: () => toast.info("Заявка отклонена, клиент уведомлён"),
        onError: () => toast.error("Ошибка при отклонении заявки")
      });
    } else {
      cancel.mutate({ id: reasonBookingId, reason }, {
        onSuccess: () => toast.info("Поездка отменена, клиент уведомлён"),
        onError: () => toast.error("Ошибка при отмене заявки")
      });
    }

    setReasonBookingId(null);
    setRejectReason('');
  };

  const confirmDelete = () => {
    if (!deleteBookingId) return;

    deleteBooking.mutate(deleteBookingId, {
      onSuccess: () => toast.success("Заявка удалена"),
      onError: () => toast.error("Ошибка при удалении заявки")
    });

    setDeleteBookingId(null);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      force_major: { label: 'Форс-мажор', className: 'bg-destructive text-destructive-foreground' },
      waiting: { label: 'Ожидает', className: 'bg-warning text-warning-foreground' },
      new: { label: 'Новая', className: 'bg-warning text-warning-foreground' },
      pending: { label: 'Ожидает', className: 'bg-warning text-warning-foreground' },
      approved: { label: 'Принята', className: 'bg-success text-success-foreground' },
      in_progress: { label: 'В процессе', className: 'bg-blue-500 text-white' },
      completed: { label: 'Завершена', className: 'bg-gray-500 text-white' },
      declined: { label: 'Отклонена', className: 'bg-muted text-muted-foreground' },
      canceled: { label: 'Отменена', className: 'bg-muted text-muted-foreground' },
    };
    const variant = variants[status as keyof typeof variants] || variants.waiting;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  if (isLoading) return <div className="p-4">Загрузка...</div>;

  return (
    <Card className="flex flex-col h-full">
      <div className="p-4 border-b border-border bg-sidebar">
        <h2 className="text-lg font-semibold text-sidebar-foreground">
          Заявки на {format(selectedDate, 'd MMMM yyyy', { locale: ru })}
        </h2>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {bookings.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Нет заявок на выбранную дату
          </div>
        ) : (
          bookings.map((booking) => (
            <Card key={booking.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {booking.requestTypeName || 'Заявка'}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {booking.priorityLabel || 'Средний'}
                    </Badge>
                    {getStatusBadge(booking.status)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {booking.startTime} — {booking.endTime} • {booking.client}
                  </div>
                </div>
                <div className="flex gap-1">
                  {(booking.status === 'waiting' || booking.status === 'new' || booking.status === 'pending') && (
                    <>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 border-success text-success hover:bg-success hover:text-success-foreground"
                        onClick={() => handleApprove(booking.id)}
                        title="Принять"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => openReasonDialog(booking.id, 'decline')}
                        title="Отклонить"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}

                  {(booking.status === 'approved' || booking.status === 'in_progress') && (
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
                      onClick={() => openReasonDialog(booking.id, 'cancel')}
                      title="Отменить"
                    >
                      <Ban className="h-4 w-4" />
                    </Button>
                  )}

                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 border-gray-300 text-gray-500 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                    onClick={() => setDeleteBookingId(booking.id)}
                    title="Удалить"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="space-y-1 py-1 border-y border-border/50 my-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Пассажир:</span>
                    <span className="font-medium text-foreground">{booking.clientName || booking.client}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Маршрут:</span>
                    <span className="font-medium text-foreground">{booking.fromLocation || '?'} → {booking.toLocation || '?'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <div className="text-muted-foreground text-[10px] uppercase font-bold tracking-tighter">Автомобиль:</div>
                    <div className="font-medium">{booking.carName || 'Не указан'}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-[10px] uppercase font-bold tracking-tighter">Водитель:</div>
                    <div className="font-medium">{booking.driverName || 'Не назначен'}</div>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  {booking.hasLuggage && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Briefcase className="h-4 w-4" />
                      <span className="text-xs">Багаж</span>
                    </div>
                  )}
                  {(booking.passengerCount || 0) > 0 && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span className="text-xs">{booking.passengerCount} чел.</span>
                    </div>
                  )}
                  {booking.isWaitMode && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs">Ожидание</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <AlertDialog open={!!reasonBookingId} onOpenChange={(open) => !open && setReasonBookingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {reasonType === 'decline' ? 'Отклонить заявку?' : 'Отменить поездку?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {reasonType === 'decline'
                ? 'Укажите причину отказа. Клиент получит уведомление с этим текстом.'
                : 'Укажите причину отмены. Клиент получит уведомление с этим текстом.'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {REJECTION_REASONS.map((reason) => (
                <Button
                  key={reason}
                  type="button"
                  size="sm"
                  variant={rejectReason === reason ? 'default' : 'outline'}
                  className="text-xs"
                  onClick={() => setRejectReason(reason)}
                >
                  {reason}
                </Button>
              ))}
            </div>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={reasonType === 'decline' ? 'Причина отказа...' : 'Причина отмены...'}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                if (!rejectReason.trim()) {
                  e.preventDefault();
                  toast.error("Укажите причину");
                  return;
                }
                confirmReason();
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              {reasonType === 'decline' ? 'Отклонить' : 'Отменить поездку'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteBookingId} onOpenChange={(open) => !open && setDeleteBookingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить заявку?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Заявка будет удалена из системы.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Да, удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
