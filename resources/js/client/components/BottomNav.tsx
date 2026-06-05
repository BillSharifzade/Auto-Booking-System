import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { telegramService } from '../services/telegram';

const BottomNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-40">
            <div className="flex justify-around items-center h-16 relative">
                {/* Left side items */}
                <button
                    onClick={() => navigate('/')}
                    className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${location.pathname === '/' ? 'text-primary-dark' : 'text-gray-400'
                        }`}
                >
                    <span className="text-2xl mb-0.5">🏠</span>
                    <span className="text-[10px] font-medium uppercase tracking-wider">Главная</span>
                </button>

                {/* Central Action Button (only for non-Telegram platforms) */}
                {!telegramService.isAvailable() && (
                    <div className="flex-1 flex justify-center -mt-8">
                        <button
                            onClick={() => navigate('/')}
                            className="w-16 h-16 bg-accent-red text-white flex items-center justify-center rounded-full shadow-xl border-4 border-white active:scale-90 transition-all"
                        >
                            <span className="text-3xl">+</span>
                        </button>
                    </div>
                )}

                {/* Right side items */}
                <button
                    onClick={() => navigate('/my-requests')}
                    className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${location.pathname === '/my-requests' ? 'text-primary-dark' : 'text-gray-400'
                        }`}
                >
                    <span className="text-2xl mb-0.5">📋</span>
                    <span className="text-[10px] font-medium uppercase tracking-wider">Заявки</span>
                </button>
            </div>
        </nav>
    );
};

export default BottomNav;
