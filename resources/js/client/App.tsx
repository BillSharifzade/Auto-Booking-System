import { Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ToastProvider } from './context/ToastContext';
import { telegramService } from './services/telegram';
import Home from './pages/Home';
import BookingPage from './pages/BookingPage';
import MyRequests from './pages/MyRequests';

function App() {
  // The client app only works inside Telegram (in dev we allow the browser
  // for testing with a mock user).
  if (!telegramService.isInTelegram() && import.meta.env.PROD) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">📱</div>
          <h1 className="text-xl font-bold text-primary-dark mb-2">
            Откройте приложение через Telegram
          </h1>
          <p className="text-gray-600">
            Бронирование автомобилей доступно только из Telegram-бота.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/booking" element={<Home />} />
          <Route path="/booking/:requestTypeId" element={<BookingPage />} />
          <Route path="/my-requests" element={<MyRequests />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </AnimatePresence>
    </ToastProvider>
  );
}

export default App;
