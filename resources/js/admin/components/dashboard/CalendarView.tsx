import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns";
import { ru } from "date-fns/locale";
import { useBookings } from "@/hooks/useBookings";

interface CalendarViewProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export function CalendarView({ selectedDate, onDateSelect }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Ideally we should filter by month, but for now we fetch recent bookings
  // TODO: Add month filtering to backend and hook
  const { bookings = [] } = useBookings();

  const getBookingStatusForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayBookings = bookings.filter((b: any) => b.date === dateStr);

    if (dayBookings.some((b: any) => b.status === 'force_major')) return 'force_major';
    if (dayBookings.some((b: any) => b.status === 'waiting' || b.status === 'new')) return 'waiting';
    if (dayBookings.some((b: any) => b.status === 'approved')) return 'approved';
    return null;
  };

  const getDayOfWeek = (date: Date) => {
    const day = date.getDay();
    return day === 0 ? 6 : day - 1;
  };

  const firstDayOfWeek = getDayOfWeek(monthStart);

  return (
    <Card className="flex flex-col h-full">
      <div className="p-4 border-b border-border bg-sidebar">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-sidebar-foreground capitalize">
            {format(currentMonth, 'LLLL yyyy', { locale: ru })}
          </h2>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-auto">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfWeek }).map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}

          {days.map((day) => {
            const status = getBookingStatusForDate(day);
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentMonth);

            return (
              <button
                key={day.toString()}
                onClick={() => {
                  // Set time to noon to avoid timezone issues when formatting
                  const selectedDay = new Date(day);
                  selectedDay.setHours(12, 0, 0, 0);
                  onDateSelect(selectedDay);
                }}
                className={`
                  aspect-square p-2 rounded-lg border transition-all relative
                  ${isSelected ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:border-primary/50'}
                  ${!isCurrentMonth && 'opacity-40'}
                `}
              >
                <span className="text-sm font-medium">{format(day, 'd')}</span>
                {status && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${status === 'force_major' ? 'bg-destructive' :
                        status === 'waiting' ? 'bg-warning' :
                          'bg-success'
                        }`}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
