import React from 'react';
import { motion } from 'framer-motion';
import { TimeSlot } from '../types';

interface TimeSlotPickerProps {
    slots: TimeSlot[];
    selectedSlot: TimeSlot | null;
    onSlotSelect: (slot: TimeSlot) => void;
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({ slots, selectedSlot, onSlotSelect }) => {
    if (slots.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <p>Нет доступных слотов на выбранную дату</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {slots.map((slot) => (
                <motion.button
                    key={slot.time}
                    onClick={() => onSlotSelect(slot)}
                    disabled={!slot.isAvailable}
                    whileTap={slot.isAvailable ? { scale: 0.98 } : {}}
                    className={`w-full p-4 rounded-lg border-2 transition-all ${selectedSlot?.time === slot.time
                            ? 'bg-primary-dark text-white border-primary-dark'
                            : slot.isAvailable
                                ? 'bg-success-light/20 border-success-light hover:border-success'
                                : 'bg-accent-red/10 border-accent-red/30 cursor-not-allowed'
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="font-semibold">{slot.time}</span>
                        <span className="text-sm">
                            {selectedSlot?.time === slot.time
                                ? '✓ Выбрано'
                                : slot.isAvailable
                                    ? '✓ Свободно'
                                    : '✕ Занято'}
                        </span>
                    </div>
                </motion.button>
            ))}
        </div>
    );
};

export default TimeSlotPicker;
