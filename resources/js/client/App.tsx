import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ToastProvider } from './context/ToastContext';
import Home from './pages/Home';
import BookingPage from './pages/BookingPage';
import MyRequests from './pages/MyRequests';

function App() {
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
