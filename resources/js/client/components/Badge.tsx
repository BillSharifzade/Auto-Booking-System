import React from 'react';
import { BookingStatus } from '../types';

interface BadgeProps {
    status: BookingStatus;
    className?: string;
}

const Badge: React.FC<BadgeProps> = ({ status, className = '' }) => {
    const getStatusStyles = () => {
        switch (status) {
            case BookingStatus.APPROVED:
                return 'bg-success/10 text-success border-success/20';
            case BookingStatus.PENDING:
            case BookingStatus.NEW:
                return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
            case BookingStatus.DECLINED:
            case BookingStatus.CANCELED:
                return 'bg-accent-red/10 text-accent-red border-accent-red/20';
            case BookingStatus.IN_PROGRESS:
                return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
            case BookingStatus.COMPLETED:
                return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
            default:
                return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    const getStatusText = () => {
        switch (status) {
            case BookingStatus.APPROVED:
                return 'Подтверждено';
            case BookingStatus.PENDING:
                return 'На модерации';
            case BookingStatus.NEW:
                return 'Новая';
            case BookingStatus.DECLINED:
                return 'Отклонено';
            case BookingStatus.CANCELED:
                return 'Отменено';
            case BookingStatus.IN_PROGRESS:
                return 'В процессе';
            case BookingStatus.COMPLETED:
                return 'Завершено';
            default:
                return status;
        }
    };

    return (
        <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyles()} ${className}`}
        >
            {getStatusText()}
        </span>
    );
};

export default Badge;
