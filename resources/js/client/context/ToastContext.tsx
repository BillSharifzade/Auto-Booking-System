import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastMessage } from '../types';
import Toast from '../components/Toast';

interface ToastContextType {
    showToast: (message: string, type?: ToastMessage['type'], duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const showToast = useCallback(
        (message: string, type: ToastMessage['type'] = 'info', duration = 3000) => {
            const id = `toast-${Date.now()}-${Math.random()}`;
            const newToast: ToastMessage = { id, message, type, duration };

            // Prevent duplicate messages
            setToasts((prev) => {
                const isDuplicate = prev.some(t => t.message === message && t.type === type);
                if (isDuplicate) return prev;

                // Limit to max 3 toasts
                const newToasts = [...prev, newToast];
                if (newToasts.length > 3) {
                    return newToasts.slice(newToasts.length - 3);
                }
                return newToasts;
            });

            // Auto remove after duration
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, duration);
        },
        []
    );

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
                {toasts.map((toast) => (
                    <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};
