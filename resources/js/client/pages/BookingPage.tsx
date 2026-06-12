import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    RequestType,
    BookingFormData,
    WaitingMode,
    TimeSlot,
    Booking,
    Department,
    Position,
} from '../types';
import {
    getRequestTypeById,
    getCarBookings,
    createBooking,
    getDepartments,
    getPositions,
} from '../services/api';
import { useToast } from '../context/ToastContext';
import { telegramService } from '../services/telegram';
import Header from '../components/Header';
import Calendar from '../components/Calendar';
import TimeSlotPicker from '../components/TimeSlotPicker';

const BookingPage: React.FC = () => {
    const { requestTypeId } = useParams<{ requestTypeId: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [requestType, setRequestType] = useState<RequestType | null>(null);
    const [loading, setLoading] = useState(true);
    const [_submitting, setSubmitting] = useState(false);

    // Form state
    const [selectedDate, setSelectedDate] = useState<string>(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
    const [formData, setFormData] = useState<Partial<BookingFormData>>({
        hasPassengers: false,
        hasLuggage: false,
        waitingMode: WaitingMode.DRIVER_WAITS,
    });

    const [existingBookings, setExistingBookings] = useState<Booking[]>([]);

    // Department and Position state
    const [departments, setDepartments] = useState<Department[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);

    useEffect(() => {
        if (requestTypeId) {
            loadRequestType();
            loadDepartmentsAndPositions();
        }
    }, [requestTypeId]);

    useEffect(() => {
        if (requestType) {
            loadBookingsAndGenerateSlots();
        }
    }, [requestType, selectedDate]);

    useEffect(() => {
        // Show/hide Telegram MainButton based on form validity
        const isValid = validateForm();
        if (isValid) {
            telegramService.showMainButton('Забронировать', handleSubmit);
        } else {
            telegramService.hideMainButton();
        }

        return () => {
            telegramService.hideMainButton();
        };
    }, [selectedSlot, formData]);

    useEffect(() => {
        // Setup back button
        telegramService.showBackButton(() => {
            navigate('/');
        });

        return () => {
            telegramService.hideBackButton();
        };
    }, [navigate]);

    const loadRequestType = async () => {
        if (!requestTypeId) return;

        setLoading(true);
        try {
            const response = await getRequestTypeById(requestTypeId);
            if (response.success && response.data) {
                setRequestType(response.data);
            } else {
                showToast('Ошибка загрузки типа заявки', 'error');
                navigate('/');
            }
        } catch (error) {
            showToast('Ошибка загрузки данных', 'error');
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const loadDepartmentsAndPositions = async () => {
        try {
            const [deptRes, posRes] = await Promise.all([
                getDepartments(),
                getPositions()
            ]);

            if (deptRes.success && deptRes.data) {
                setDepartments(deptRes.data.filter(d => d.isActive));
            }

            if (posRes.success && posRes.data) {
                setPositions(posRes.data.filter(p => p.isActive));
            }
        } catch (error) {
            console.error('Error loading auxiliary data:', error);
        }
    };

    const loadBookingsAndGenerateSlots = async () => {
        if (!requestType) return;

        try {
            const response = await getCarBookings(requestType.carId, selectedDate);
            if (response.success && response.data) {
                setExistingBookings(response.data);
                generateTimeSlots(response.data);
            } else {
                // API failed or no bookings - still generate empty slots
                setExistingBookings([]);
                generateTimeSlots([]);
            }
        } catch (error) {
            console.error('Error loading bookings:', error);
            // Even on error, generate slots so user can book
            setExistingBookings([]);
            generateTimeSlots([]);
            showToast('Ошибка загрузки расписания', 'error');
        }
    };

    // Utility to get current Dushanbe time
    const getDushanbeNow = () => {
        const now = new Date();
        const dushanbeOffset = 5 * 60; // Dushanbe is UTC+5
        const userOffset = now.getTimezoneOffset(); // in minutes
        return new Date(now.getTime() + (dushanbeOffset + userOffset) * 60000);
    };

    const generateTimeSlots = (bookings: Booking[]) => {
        const slots: TimeSlot[] = [];
        // Parse date as YYYY-MM-DD to avoid timezone shifts
        const [year, month, day] = selectedDate.split('-').map(Number);
        const now = getDushanbeNow();
        // Bookings must be made at least 3 hours before the trip start.
        const minBookingTime = new Date(now.getTime() + 3 * 60 * 60 * 1000);

        // Generate slots from 8:00 to 20:00 with 30-min intervals
        for (let hour = 8; hour < 20; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                // Create a date object that specifically represents the time in Dushanbe
                const slotTime = new Date(year, month - 1, day, hour, minute, 0, 0);

                // Enforce the 3-hour advance booking rule (hides too-soon slots).
                if (slotTime < minBookingTime) {
                    continue;
                }

                const timeString = `${hour.toString().padStart(2, '0')}:${minute
                    .toString()
                    .padStart(2, '0')}`;

                // Check if slot is blocked by existing booking
                const isBlocked = bookings.some((booking) => {
                    // booking.dateTimeFrom is UTC ISO string
                    const bookingFrom = new Date(booking.dateTimeFrom);
                    const bookingTo = new Date(booking.dateTimeTo);

                    // Convert back to local for comparison (since slotTime is local)
                    // Wait, this is getting complex. Let's simplify.
                    // If we treat EVERYTHING as relative to Dushanbe:

                    const bFrom = new Date(bookingFrom.getTime() + (5 * 60 + bookingFrom.getTimezoneOffset()) * 60000);
                    const bTo = new Date(bookingTo.getTime() + (5 * 60 + bookingTo.getTimezoneOffset()) * 60000);
                    const bToWithBuffer = new Date(bTo.getTime() + 30 * 60000);

                    return slotTime >= bFrom && slotTime < bToWithBuffer;
                });

                slots.push({
                    time: timeString,
                    datetime: slotTime,
                    isAvailable: !isBlocked,
                    isBlocked,
                    isSelected: false,
                });
            }
        }

        setTimeSlots(slots);
    };

    const handleSlotClick = (slot: TimeSlot) => {
        if (!slot.isAvailable) {
            showToast('Этот слот занят', 'warning');
            return;
        }

        setSelectedSlot(slot);

        // Auto-fill form times
        const endTime = new Date(slot.datetime.getTime() + 60 * 60000); // +1 hour
        setFormData((prev) => ({
            ...prev,
            timeFrom: slot.time,
            timeTo: `${endTime.getHours().toString().padStart(2, '0')}:${endTime
                .getMinutes()
                .toString()
                .padStart(2, '0')}`,
        }));

        // Scroll to form
        setTimeout(() => {
            document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const validateForm = (): boolean => {
        if (!selectedSlot) return false;
        if (!formData.timeFrom || !formData.timeTo) return false;
        if (!formData.departmentId || !formData.positionId) return false;
        if (!formData.clientName || !formData.fromLocation || !formData.toLocation) return false;

        const timeFrom = new Date(`${selectedDate}T${formData.timeFrom}`);
        const timeTo = new Date(`${selectedDate}T${formData.timeTo}`);

        if (timeFrom >= timeTo) return false;

        return true;
    };

    const handleSubmit = async () => {
        // Prevent double submission
        if (_submitting) return;

        if (!validateForm() || !requestType || !requestTypeId) {
            showToast('Заполните все поля корректно', 'error');
            return;
        }

        setSubmitting(true);
        telegramService.setMainButtonLoading(true);

        const bookingData: BookingFormData = {
            requestTypeId,
            date: selectedDate,
            timeFrom: formData.timeFrom!,
            timeTo: formData.timeTo!,
            departmentId: formData.departmentId,
            positionId: formData.positionId,
            clientName: formData.clientName,
            fromLocation: formData.fromLocation,
            toLocation: formData.toLocation,
            comment: formData.comment,
            hasPassengers: formData.hasPassengers || false,
            hasLuggage: formData.hasLuggage || false,
            waitingMode: formData.waitingMode || WaitingMode.DRIVER_WAITS,
            returnTime: formData.returnTime,
        };

        try {
            // We rely on the backend to check availability and handle idempotency
            const response = await createBooking(bookingData);

            if (response.success) {
                showToast(response.message || 'Заявка создана!', 'success');
                setTimeout(() => {
                    navigate('/my-requests');
                }, 1000);
            } else {
                showToast(response.error || 'Ошибка при создании заявки', 'error');
                // Refresh slots in case of availability error
                loadBookingsAndGenerateSlots();
            }
        } catch (error) {
            console.error('Submit error:', error);
            showToast('Ошибка создания заявки. Попробуйте снова.', 'error');
        } finally {
            setSubmitting(false);
            telegramService.setMainButtonLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-dark border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-600">Загрузка...</p>
                </div>
            </div>
        );
    }

    if (!requestType) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background pb-24">
            <Header
                title={requestType.name}
                subtitle={`Бронирование для ${requestType.carName || 'автомобиля'}`}
            />

            {/* Calendar */}
            <div className="p-4">
                <Calendar
                    selectedDate={new Date(selectedDate + 'T12:00:00')}
                    onDateSelect={(date) => {
                        // Use local date format to avoid timezone issues
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        setSelectedDate(`${year}-${month}-${day}`);
                        setSelectedSlot(null); // Reset slot when date changes
                    }}
                    bookedDates={existingBookings.map((b) => new Date(b.dateTimeFrom))}
                />
            </div>

            {/* Time Slots for selected date */}
            {timeSlots.length > 0 && (
                <div className="px-4 pb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                        Доступные слоты на {new Date(selectedDate).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        })}
                    </h3>
                    <TimeSlotPicker
                        slots={timeSlots}
                        selectedSlot={selectedSlot}
                        onSlotSelect={handleSlotClick}
                    />
                </div>
            )}

            {/* Booking Form */}
            {selectedSlot && (
                <motion.div
                    id="booking-form"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-white border-t-4 border-primary-dark"
                >
                    <h3 className="text-lg font-bold text-primary-dark mb-4">Детали заявки</h3>

                    <div className="space-y-4">
                        {/* Client Name (ФИО) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                ФИО пассажира
                            </label>
                            <input
                                type="text"
                                placeholder="Введите имя и фамилию"
                                value={formData.clientName || ''}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, clientName: e.target.value }))
                                }
                                className="input-field"
                                required
                            />
                        </div>

                        {/* Route: From -> To */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Откуда
                                </label>
                                <input
                                    type="text"
                                    placeholder="Напр. Офис"
                                    value={formData.fromLocation || ''}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, fromLocation: e.target.value }))
                                    }
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Куда
                                </label>
                                <input
                                    type="text"
                                    placeholder="Напр. Аэропорт"
                                    value={formData.toLocation || ''}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, toLocation: e.target.value }))
                                    }
                                    className="input-field"
                                    required
                                />
                            </div>
                        </div>

                        {/* Comment */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Комментарий (необязательно)
                            </label>
                            <textarea
                                placeholder="Дополнительная информация для водителя"
                                value={formData.comment || ''}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, comment: e.target.value }))
                                }
                                className="input-field min-h-[80px] py-2"
                            />
                        </div>
                        {/* Department Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ваш отдел
                            </label>
                            <select
                                value={formData.departmentId || ''}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, departmentId: e.target.value }))
                                }
                                className="input-field bg-white"
                                required
                            >
                                <option value="">Выберите отдел</option>
                                {departments.map((dept) => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.shortName} — {dept.fullName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Position Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ваша должность
                            </label>
                            <select
                                value={formData.positionId || ''}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, positionId: e.target.value }))
                                }
                                className="input-field bg-white"
                                required
                            >
                                <option value="">Выберите должность</option>
                                {positions.map((pos) => (
                                    <option key={pos.id} value={pos.id}>
                                        {pos.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Time From */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Время начала
                                </label>
                                <input
                                    type="time"
                                    value={formData.timeFrom || ''}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, timeFrom: e.target.value }))
                                    }
                                    className="input-field"
                                />
                            </div>

                            {/* Time To */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Время окончания
                                </label>
                                <input
                                    type="time"
                                    value={formData.timeTo || ''}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, timeTo: e.target.value }))
                                    }
                                    className="input-field"
                                />
                            </div>
                        </div>

                        {/* Has Passengers */}
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.hasPassengers || false}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, hasPassengers: e.target.checked }))
                                }
                                className="w-5 h-5 text-primary-dark rounded focus:ring-primary-dark"
                            />
                            <span className="text-gray-700">Есть пассажиры</span>
                        </label>

                        {/* Has Luggage */}
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.hasLuggage || false}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, hasLuggage: e.target.checked }))
                                }
                                className="w-5 h-5 text-primary-dark rounded focus:ring-primary-dark"
                            />
                            <span className="text-gray-700">Есть багаж</span>
                        </label>

                        {/* Waiting Mode */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Режим ожидания
                            </label>
                            <div className="space-y-2">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="waitingMode"
                                        checked={formData.waitingMode === WaitingMode.DRIVER_WAITS}
                                        onChange={() =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                waitingMode: WaitingMode.DRIVER_WAITS,
                                            }))
                                        }
                                        className="w-4 h-4 text-primary-dark focus:ring-primary-dark"
                                    />
                                    <span className="text-gray-700">Водитель ждет</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="waitingMode"
                                        checked={formData.waitingMode === WaitingMode.DRIVER_RETURNS}
                                        onChange={() =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                waitingMode: WaitingMode.DRIVER_RETURNS,
                                            }))
                                        }
                                        className="w-4 h-4 text-primary-dark focus:ring-primary-dark"
                                    />
                                    <span className="text-gray-700">Водитель возвращается</span>
                                </label>
                            </div>
                        </div>

                        {/* Return Time (if DRIVER_RETURNS) */}
                        {formData.waitingMode === WaitingMode.DRIVER_RETURNS && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Время возврата
                                </label>
                                <input
                                    type="time"
                                    value={formData.returnTime || ''}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, returnTime: e.target.value }))
                                    }
                                    className="input-field"
                                />
                            </div>
                        )}

                        {/* Inside Telegram the native MainButton submits the form;
                            this fallback only renders in dev/browser mode. */}
                        {!telegramService.isInTelegram() && (
                            <div className="pt-4 pb-8">
                                <button
                                    onClick={handleSubmit}
                                    disabled={!validateForm() || _submitting}
                                    className={`w-full py-4 rounded-2xl font-bold text-white transition-all shadow-xl active:scale-95 ${!validateForm() || _submitting
                                        ? 'bg-gray-300 cursor-not-allowed shadow-none'
                                        : 'bg-primary-dark hover:shadow-primary-dark/20'
                                        }`}
                                >
                                    {_submitting ? 'Создание заявки...' : 'Забронировать'}
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default BookingPage;
