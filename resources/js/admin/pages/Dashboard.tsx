import { useState } from "react";
import { CalendarView } from "@/components/dashboard/CalendarView";
import { BookingList } from "@/components/dashboard/BookingList";
import { TimelineModal } from "@/components/dashboard/TimelineModal";
import { ForceMajorModal } from "@/components/dashboard/ForceMajorModal";
import { BookingFormModal } from "@/components/bookings/BookingFormModal";
import { Button } from "@/components/ui/button";
import { Clock, AlertTriangle, Plus } from "lucide-react";

const Dashboard = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    return today;
  });
  const [showTimeline, setShowTimeline] = useState(false);
  const [showForceMajor, setShowForceMajor] = useState(false);
  const [showBooking, setShowBooking] = useState(false);

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Панель управления</h1>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowBooking(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Создать бронь
            </Button>
            <Button
              onClick={() => setShowForceMajor(true)}
              variant="outline"
              className="gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Создать блокировку
            </Button>
            <Button
              onClick={() => setShowTimeline(true)}
              className="gap-2"
            >
              <Clock className="h-4 w-4" />
              Почасовой график
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 overflow-hidden">
        <div className="flex flex-col min-h-0">
          <CalendarView selectedDate={selectedDate} onDateSelect={setSelectedDate} />
        </div>
        <div className="flex flex-col min-h-0">
          <BookingList selectedDate={selectedDate} />
        </div>
      </div>

      <TimelineModal open={showTimeline} onOpenChange={setShowTimeline} />
      <ForceMajorModal open={showForceMajor} onOpenChange={setShowForceMajor} />
      <BookingFormModal open={showBooking} onOpenChange={setShowBooking} />
    </div>
  );
};

export default Dashboard;
