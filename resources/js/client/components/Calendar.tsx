import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface CalendarProps {
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
    bookedDates?: Date[];
}

const Calendar: React.FC<CalendarProps> = ({ selectedDate, onDateSelect, bookedDates = [] }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));

    const monthNames = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];

    const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // Get day of week (0 = Sunday, 1 = Monday, etc.)
        let firstDayOfWeek = firstDay.getDay();
        // Convert to Monday = 0, Sunday = 6
        firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

        const daysInMonth = lastDay.getDate();
        const days: (Date | null)[] = [];

        // Add empty cells for days before month starts
        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }

        return days;
    };

    const isToday = (date: Date | null) => {
        if (!date) return false;
        const today = new Date();
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    };

    const isSelected = (date: Date | null) => {
        if (!date) return false;
        return (
            date.getDate() === selectedDate.getDate() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getFullYear() === selectedDate.getFullYear()
        );
    };

    const isPast = (date: Date | null) => {
        if (!date) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const compareDate = new Date(date);
        compareDate.setHours(0, 0, 0, 0);
        return compareDate < today;
    };

    const hasBookings = (date: Date | null) => {
        if (!date) return false;
        return bookedDates.some(
            (bookedDate) =>
                bookedDate.getDate() === date.getDate() &&
                bookedDate.getMonth() === date.getMonth() &&
                bookedDate.getFullYear() === date.getFullYear()
        );
    };

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const handleDateClick = (date: Date | null) => {
        if (!date || isPast(date)) return;
        onDateSelect(date);
    };

    const days = getDaysInMonth(currentMonth);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {/* Header with month navigation */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-primary-dark text-white rounded-t-xl">
                <button
                    onClick={handlePrevMonth}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                    ‹
                </button>
                <h3 className="font-semibold text-lg">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h3>
                <button
                    onClick={handleNextMonth}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                    ›
                </button>
            </div>

            {/* Week days header */}
            <div className="grid grid-cols-7 gap-1 p-2 border-b border-gray-100">
                {weekDays.map((day) => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1 p-2">
                {days.map((date, index) => {
                    const isDateSelected = isSelected(date);
                    const isDateToday = isToday(date);
                    const isDatePast = isPast(date);
                    const hasDateBookings = hasBookings(date);

                    return (
                        <motion.button
                            key={index}
                            onClick={() => handleDateClick(date)}
                            disabled={!date || isDatePast}
                            whileTap={date && !isDatePast ? { scale: 0.95 } : {}}
                            className={`
                aspect-square p-2 rounded-lg text-sm font-medium transition-all relative
                ${!date ? 'invisible' : ''}
                ${isDatePast ? 'text-gray-300 cursor-not-allowed' : ''}
                ${isDateSelected ? 'bg-accent-red text-white shadow-md' : ''}
                ${isDateToday && !isDateSelected ? 'border-2 border-accent-red text-accent-red' : ''}
                ${!isDateSelected && !isDateToday && !isDatePast ? 'hover:bg-gray-100' : ''}
              `}
                        >
                            {date && (
                                <>
                                    <span>{date.getDate()}</span>
                                    {hasDateBookings && !isDateSelected && (
                                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                                            <div className="w-1 h-1 rounded-full bg-success"></div>
                                        </div>
                                    )}
                                </>
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};

export default Calendar;
