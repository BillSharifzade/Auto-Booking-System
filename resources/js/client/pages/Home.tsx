import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RequestType } from '../types';
import { getRequestTypes } from '../services/api';
import { useToast } from '../context/ToastContext';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';

const Home: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRequestTypes();
    }, []);

    const loadRequestTypes = async () => {
        setLoading(true);
        try {
            const response = await getRequestTypes();
            if (response.success && response.data) {
                setRequestTypes(response.data);
            } else {
                showToast('Ошибка загрузки типов заявок', 'error');
            }
        } catch (error) {
            showToast('Ошибка загрузки данных', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectRequestType = (requestType: RequestType) => {
        navigate(`/booking/${requestType.id}`);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.3,
            },
        },
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
            <Header title="Бронирование автомобиля" subtitle="Выберите тип заявки" />

            <motion.div
                className="p-4 space-y-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {requestTypes.map((requestType) => (
                    <motion.div
                        key={requestType.id}
                        variants={itemVariants}
                        whileTap={{ scale: 0.98 }}
                    >
                        <button
                            onClick={() => handleSelectRequestType(requestType)}
                            className="w-full card hover:shadow-md transition-all duration-200 text-left"
                        >
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
                                    style={{
                                        backgroundColor: requestType.color
                                            ? `${requestType.color}20`
                                            : '#3c324c20',
                                    }}
                                >
                                    {requestType.icon || '🚗'}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-primary-dark text-lg">
                                        {requestType.name}
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {requestType.description}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <span className="text-xs font-medium text-primary-dark/70 bg-primary-dark/5 px-2 py-0.5 rounded-full">
                                            {requestType.carName}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            Приоритет: {requestType.priority}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-primary-dark text-xl">›</div>
                            </div>
                        </button>
                    </motion.div>
                ))}
            </motion.div>

            <BottomNav />
        </div>
    );
};

export default Home;
