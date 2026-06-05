import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Booking, BookingStatus } from '../types';
import { getUserBookings, cancelBooking } from '../services/api';
import { useToast } from '../context/ToastContext';
import { telegramService } from '../services/telegram';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import Badge from '../components/Badge';

const MyRequests: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = async () => {
        setLoading(true);
        try {
            const user = telegramService.getUser();

            const response = await getUserBookings(user?.id);
            if (response.success && response.data) {
                setBookings(response.data);
            } else {
                showToast('Ошибка загрузки заявок', 'error');
            }
        } catch (error) {
            showToast('Ошибка загрузки данных', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = async (bookingId: string) => {
        telegramService.showConfirm('Вы уверены, что хотите отменить заявку?', async (confirmed) => {
            if (!confirmed) return;

            setCancellingId(bookingId);
            try {
                const response = await cancelBooking(bookingId);
                if (response.success) {
                    showToast('Заявка отменена', 'success');
                    loadBookings(); // Reload bookings
                } else {
                    showToast(response.error || 'Ошибка отмены заявки', 'error');
                }
            } catch (error) {
                showToast('Ошибка отмены заявки', 'error');
            } finally {
                setCancellingId(null);
            }
        });
    };

    // const formatDateTime = (dateString: string) => { ... } // Removed, using backend formatting

    const canCancel = (booking: Booking) => {
        return (
            booking.status === BookingStatus.PENDING ||
            booking.status === BookingStatus.APPROVED ||
            booking.status === BookingStatus.NEW
        );
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

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className={`p-1 text-[10px] text-center text-white ${telegramService.isAvailable() ? 'bg-green-600' : 'bg-orange-500'}`}>
                {telegramService.isAvailable()
                    ? `Telegram Session: ${telegramService.getUser()?.id || 'No User'} (InitData: ${telegramService.getInitData().length} chars)`
                    : (
                        <div className="flex items-center justify-center gap-2">
                            <span>Guest/Mock Session: {telegramService.getUser()?.id} (Local)</span>
                            <button
                                onClick={() => { localStorage.removeItem('telegram_mock_user'); window.location.reload(); }}
                                className="underline hover:text-white/80"
                            >
                                Reset
                            </button>
                        </div>
                    )}
            </div>
            <Header title="Мои заявки" subtitle={`Всего заявок: ${bookings.length}`} />

            <div className="p-4 space-y-3">
                {bookings.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4 text-gray-300">📋</div>
                        <p className="text-gray-600 text-lg font-medium">У вас пока нет заявок</p>
                        <p className="text-gray-500 text-sm mt-2">
                            Выберите тип поездки на главной странице
                        </p>
                        {!telegramService.isAvailable() && (
                            <button
                                onClick={() => navigate('/')}
                                className="mt-8 py-3 px-10 bg-primary-dark text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all"
                            >
                                Создать заявку
                            </button>
                        )}
                    </div>
                ) : (
                    bookings.map((booking, index) => (
                        <motion.div
                            key={booking.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="card"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-primary-dark text-lg">
                                        Заявка #{booking.id.slice(-6)}
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {booking.formattedStartTime || new Date(booking.dateTimeFrom).toLocaleString()}
                                    </p>
                                </div>
                                <Badge status={booking.status} />
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-500">🚗</span>
                                    <span className="text-gray-700">Автомобиль: {booking.carName || booking.carId}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-500">⏱️</span>
                                    <span className="text-gray-700">
                                        {booking.formattedTimeRange || `${new Date(booking.dateTimeFrom).toLocaleTimeString()} - ${new Date(booking.dateTimeTo).toLocaleTimeString()}`}
                                    </span>
                                </div>
                                {booking.hasPassengers && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500">👥</span>
                                        <span className="text-gray-700">С пассажирами</span>
                                    </div>
                                )}
                                {booking.hasLuggage && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500">🧳</span>
                                        <span className="text-gray-700">С багажом</span>
                                    </div>
                                )}
                            </div>

                            {booking.declineReason && (
                                <div className="mt-3 p-3 bg-accent-red/10 border border-accent-red/20 rounded-lg">
                                    <p className="text-sm text-accent-red">
                                        <strong>Причина отклонения:</strong> {booking.declineReason}
                                    </p>
                                </div>
                            )}

                            {canCancel(booking) && (
                                <div className="mt-4 pt-3 border-t border-gray-200">
                                    <button
                                        onClick={() => handleCancelBooking(booking.id)}
                                        disabled={cancellingId === booking.id}
                                        className="btn-outline w-full disabled:opacity-50"
                                    >
                                        {cancellingId === booking.id ? 'Отмена...' : 'Отменить заявку'}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    ))
                )}
            </div>

            <BottomNav />
        </div>
    );
};

export default MyRequests;
