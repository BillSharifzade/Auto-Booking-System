import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastMessage } from '../types';

interface ToastProps {
    toast: ToastMessage;
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
    useEffect(() => {
        if (toast.duration) {
            const timer = setTimeout(onClose, toast.duration);
            return () => clearTimeout(timer);
        }
    }, [toast.duration, onClose]);

    const getToastStyles = () => {
        switch (toast.type) {
            case 'success':
                return 'bg-green-600 text-white';
            case 'error':
                return 'bg-red-500 text-white';
            case 'warning':
                return 'bg-yellow-500 text-white';
            case 'info':
            default:
                return 'bg-blue-600 text-white';
        }
    };

    const getIcon = () => {
        switch (toast.type) {
            case 'success':
                return '✓';
            case 'error':
                return '✕';
            case 'warning':
                return '⚠';
            case 'info':
            default:
                return 'ℹ';
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`${getToastStyles()} px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[280px] max-w-sm`}
            >
                <span className="text-xl font-bold">{getIcon()}</span>
                <p className="flex-1 text-sm font-medium">{toast.message}</p>
                <button
                    onClick={onClose}
                    className="text-white/80 hover:text-white transition-colors ml-2"
                >
                    ✕
                </button>
            </motion.div>
        </AnimatePresence>
    );
};

export default Toast;
