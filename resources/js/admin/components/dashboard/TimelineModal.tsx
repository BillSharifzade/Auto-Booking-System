import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useVehicles } from "@/hooks/useVehicles";
import { useBookings } from "@/hooks/useBookings";
import { useEffect, useState } from "react";

interface TimelineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TimelineModal({ open, onOpenChange }: TimelineModalProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (open) {
      const timer = setInterval(() => setCurrentTime(new Date()), 60000);
      return () => clearInterval(timer);
    }
  }, [open]);

  // Get today's date in local format
  const today = (() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();

  // Fetch cars
  const { vehicles: cars = [] } = useVehicles(undefined, { enabled: open });

  // Fetch bookings for today
  const { bookings = [] } = useBookings({ date: today }, { enabled: open });

  const getBookingPosition = (startTime: string, endTime: string) => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const start = startHour + startMin / 60;
    const end = endHour + endMin / 60;
    return { start, duration: end - start };
  };

  const currentHourPosition = currentTime.getHours() + currentTime.getMinutes() / 60;
  const showCurrentTime = true; // For now always show on today's view

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'force_major':
        return 'bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]';
      case 'waiting':
      case 'new':
      case 'pending':
        return 'bg-amber-500/20 border-amber-500 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
      case 'approved':
        return 'bg-emerald-500/20 border-emerald-500 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
      case 'in_progress':
        return 'bg-blue-500/20 border-blue-500 text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.2)]';
      default:
        return 'bg-slate-500/20 border-slate-500 text-slate-500 shadow-[0_0_10px_rgba(100,116,139,0.2)]';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[95vw] max-w-none h-[90vh] flex flex-col p-0 overflow-hidden border-none bg-background/95 backdrop-blur-xl"
        aria-describedby={undefined}
      >
        <DialogHeader className="px-6 py-4 border-b border-border/50 bg-card/50">
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Почасовой график на {format(new Date(), 'd MMMM yyyy', { locale: ru })}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-grid-slate-100/[0.03] relative">
          <div className="relative min-w-[1200px]">
            {/* Header with hours */}
            <div className="flex sticky top-0 bg-background/80 backdrop-blur-md z-30 border-b border-border/50">
              <div className="w-48 flex-shrink-0 p-4 border-r border-border/50 bg-card/80">
                <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground/70">Автомобиль</span>
              </div>
              <div className="flex-1 flex">
                {hours.map(hour => (
                  <div key={hour} className="flex-1 p-4 border-r border-border/30 text-center relative group">
                    <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                      {hour.toString().padStart(2, '0')}:00
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline rows */}
            {cars.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-20 text-muted-foreground">
                <div className="text-lg">Нет автомобилей для отображения</div>
              </div>
            ) : (
              <div className="relative">
                {/* Current Time Line */}
                {showCurrentTime && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                    style={{ left: `calc(12rem + ${(currentHourPosition / 24) * 100}%)` }}
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-red-500" />
                  </div>
                )}

                {cars.map(car => {
                  const carBookings = bookings.filter(b => b.carId === car.id);

                  return (
                    <div key={car.id} className="flex border-b border-border/30 hover:bg-muted/30 transition-colors group/row">
                      <div className="w-48 flex-shrink-0 p-4 border-r border-border/50 bg-card/30 sticky left-0 z-10 backdrop-blur-sm">
                        <div className="text-sm font-bold text-foreground group-hover/row:text-primary transition-colors">{car.model}</div>
                        <div className="text-xs font-mono text-muted-foreground mt-1 px-1.5 py-0.5 rounded bg-muted/50 inline-block">
                          {car.licensePlate}
                        </div>
                      </div>
                      <div className="flex-1 relative h-24">
                        {/* Hour markers */}
                        <div className="absolute inset-0 flex">
                          {hours.map(hour => (
                            <div key={hour} className="flex-1 border-r border-border/20 group-hover/row:border-border/40 transition-colors" />
                          ))}
                        </div>

                        {/* Bookings */}
                        {carBookings.map(booking => {
                          if (!booking.startTime || !booking.endTime) return null;
                          const { start, duration } = getBookingPosition(booking.startTime, booking.endTime);
                          const leftPercent = (start / 24) * 100;
                          const widthPercent = (duration / 24) * 100;

                          return (
                            <div
                              key={booking.id}
                              className={`absolute top-3 bottom-3 rounded-lg border-2 p-2 text-xs overflow-hidden transition-all hover:scale-[1.02] hover:z-10 group/booking cursor-pointer ${getStatusStyles(booking.status)}`}
                              style={{
                                left: `${leftPercent}%`,
                                width: `${Math.max(widthPercent, 4)}%`,
                                minWidth: '80px',
                              }}
                              title={`${booking.clientName || booking.client}: ${booking.fromLocation} → ${booking.toLocation}`}
                            >
                              <div className="font-bold truncate">{booking.clientName || booking.client}</div>
                              <div className="text-[10px] opacity-90 truncate font-semibold">
                                {booking.fromLocation || '?'} → {booking.toLocation || '?'}
                              </div>
                              <div className="text-[10px] opacity-80 truncate font-medium mt-0.5">
                                {booking.startTime} - {booking.endTime}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}