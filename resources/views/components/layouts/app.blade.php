<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ config('app.name', 'Бронирование') }}</title>
    
    <!-- Telegram WebApp SDK -->
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    
    <!-- Inter Font -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <style>
        :root {
            /* Primary Colors - from webapp_forbooking */
            --primary-dark: #3c324c;
            --accent-red: #ed2e38;
            --success: #22c55e;
            --success-light: #86efac;
            --warning: #f59e0b;
            
            /* Backgrounds */
            --background: #f8f9fa;
            --background-white: #ffffff;
            --card-bg: #ffffff;
            
            /* Text */
            --text-primary: #3c324c;
            --text-secondary: #6b7280;
            --text-muted: #9ca3af;
            
            /* Borders */
            --border-color: #e5e7eb;
            --border-light: #f3f4f6;
            
            /* Status Colors */
            --status-new: #fef3c7;
            --status-new-text: #92400e;
            --status-approved: #d1fae5;
            --status-approved-text: #065f46;
            --status-progress: #dbeafe;
            --status-progress-text: #1e40af;
            --status-completed: #e5e7eb;
            --status-completed-text: #374151;
            --status-declined: #fee2e2;
            --status-declined-text: #991b1b;
            
            /* Telegram Theme (overridden by JS) */
            --tg-theme-bg-color: var(--background);
            --tg-theme-text-color: var(--text-primary);
            --tg-theme-hint-color: var(--text-muted);
            --tg-theme-link-color: var(--accent-red);
            --tg-theme-button-color: var(--accent-red);
            --tg-theme-button-text-color: #ffffff;
            --tg-theme-secondary-bg-color: var(--card-bg);
        }
        
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: var(--background);
            color: var(--text-primary);
            min-height: 100vh;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        
        .container {
            max-width: 500px;
            margin: 0 auto;
            padding-bottom: 80px; /* Space for bottom nav */
        }
        
        /* Header Component */
        .header {
            background: var(--primary-dark);
            color: white;
            padding: 20px 16px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 4px;
        }
        
        .header p {
            font-size: 14px;
            opacity: 0.8;
        }
        
        /* Card Component */
        .card {
            background: var(--card-bg);
            border-radius: 12px;
            padding: 16px;
            margin: 12px 16px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            border: 1px solid var(--border-light);
        }
        
        .card-title {
            font-size: 16px;
            font-weight: 600;
            color: var(--primary-dark);
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        /* Form Elements */
        .form-group {
            margin-bottom: 16px;
        }
        
        .form-group label {
            display: block;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 8px;
            color: var(--text-secondary);
        }
        
        .form-control {
            width: 100%;
            padding: 12px 16px;
            font-size: 16px;
            font-family: inherit;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            background: var(--background-white);
            color: var(--text-primary);
            outline: none;
            transition: all 0.2s;
        }
        
        .form-control:focus {
            border-color: var(--primary-dark);
            box-shadow: 0 0 0 3px rgba(60, 50, 76, 0.1);
        }
        
        select.form-control {
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 12px center;
            padding-right: 36px;
        }
        
        /* Checkbox & Radio */
        .checkbox-group, .radio-group {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        
        .checkbox-item, .radio-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            background: var(--background);
            border-radius: 8px;
            cursor: pointer;
            transition: background 0.2s;
        }
        
        .checkbox-item:hover, .radio-item:hover {
            background: var(--border-light);
        }
        
        .checkbox-item input, .radio-item input {
            width: 20px;
            height: 20px;
            accent-color: var(--primary-dark);
        }
        
        /* Buttons */
        .btn {
            display: block;
            width: 100%;
            padding: 14px 24px;
            font-size: 16px;
            font-weight: 600;
            font-family: inherit;
            text-align: center;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .btn:active {
            transform: scale(0.98);
        }
        
        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }
        
        .btn-primary {
            background: var(--accent-red);
            color: white;
        }
        
        .btn-primary:hover:not(:disabled) {
            background: #d4282f;
        }
        
        .btn-secondary {
            background: var(--background);
            color: var(--text-primary);
            border: 1px solid var(--border-color);
        }
        
        .btn-outline {
            background: transparent;
            color: var(--accent-red);
            border: 2px solid var(--accent-red);
        }
        
        .btn-outline:hover:not(:disabled) {
            background: rgba(237, 46, 56, 0.1);
        }
        
        /* Status Badge */
        .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
        }
        
        .badge-new { background: var(--status-new); color: var(--status-new-text); }
        .badge-approved { background: var(--status-approved); color: var(--status-approved-text); }
        .badge-in_progress { background: var(--status-progress); color: var(--status-progress-text); }
        .badge-completed { background: var(--status-completed); color: var(--status-completed-text); }
        .badge-declined, .badge-canceled { background: var(--status-declined); color: var(--status-declined-text); }
        
        /* Booking Item */
        .booking-item {
            background: var(--background-white);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 12px;
            border: 1px solid var(--border-light);
        }
        
        .booking-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;
        }
        
        .booking-id {
            font-weight: 600;
            font-size: 16px;
            color: var(--primary-dark);
        }
        
        .booking-date {
            font-size: 13px;
            color: var(--text-secondary);
            margin-top: 4px;
        }
        
        .booking-details {
            font-size: 14px;
            color: var(--text-secondary);
        }
        
        .booking-details .detail-row {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 6px;
        }
        
        .booking-details .detail-row:last-child {
            margin-bottom: 0;
        }
        
        .btn-cancel {
            margin-top: 12px;
            padding: 10px 16px;
            font-size: 14px;
        }
        
        /* Bottom Navigation */
        .bottom-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: var(--background-white);
            border-top: 1px solid var(--border-color);
            display: flex;
            justify-content: space-around;
            padding: 8px 0;
            padding-bottom: max(8px, env(safe-area-inset-bottom));
            z-index: 100;
        }
        
        .nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            flex: 1;
            padding: 8px;
            color: var(--text-muted);
            text-decoration: none;
            transition: color 0.2s;
            background: none;
            border: none;
            cursor: pointer;
            font-family: inherit;
        }
        
        .nav-item.active {
            color: var(--primary-dark);
        }
        
        .nav-item .icon {
            font-size: 24px;
            margin-bottom: 4px;
        }
        
        .nav-item .label {
            font-size: 12px;
            font-weight: 500;
        }
        
        /* Calendar Component */
        .calendar {
            background: var(--card-bg);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            border: 1px solid var(--border-light);
            margin: 16px;
        }
        
        .calendar-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px;
            background: var(--primary-dark);
            color: white;
        }
        
        .calendar-header button {
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: white;
            width: 36px;
            height: 36px;
            border-radius: 8px;
            font-size: 18px;
            cursor: pointer;
            transition: background 0.2s;
        }
        
        .calendar-header button:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        
        .calendar-header h3 {
            font-size: 16px;
            font-weight: 600;
        }
        
        .calendar-weekdays {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            padding: 8px;
            border-bottom: 1px solid var(--border-light);
        }
        
        .calendar-weekdays span {
            text-align: center;
            font-size: 12px;
            font-weight: 500;
            color: var(--text-muted);
            padding: 8px 0;
        }
        
        .calendar-days {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 4px;
            padding: 8px;
        }
        
        .calendar-day {
            aspect-ratio: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: 500;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
            background: none;
            color: var(--text-primary);
            position: relative;
        }
        
        .calendar-day:hover:not(.disabled):not(.selected) {
            background: var(--border-light);
        }
        
        .calendar-day.today:not(.selected) {
            border: 2px solid var(--accent-red);
            color: var(--accent-red);
        }
        
        .calendar-day.selected {
            background: var(--accent-red);
            color: white;
        }
        
        .calendar-day.disabled {
            color: var(--text-muted);
            opacity: 0.4;
            cursor: not-allowed;
        }
        
        .calendar-day.has-booking::after {
            content: '';
            position: absolute;
            bottom: 4px;
            left: 50%;
            transform: translateX(-50%);
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: var(--success);
        }
        
        /* Time Slots */
        .time-slots {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            padding: 16px;
        }
        
        .time-slot {
            padding: 10px 8px;
            border-radius: 8px;
            text-align: center;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            border: 1px solid var(--border-color);
            background: var(--background-white);
            color: var(--text-primary);
        }
        
        .time-slot:hover:not(.disabled):not(.selected) {
            border-color: var(--primary-dark);
        }
        
        .time-slot.selected {
            background: var(--accent-red);
            color: white;
            border-color: var(--accent-red);
        }
        
        .time-slot.disabled {
            background: var(--border-light);
            color: var(--text-muted);
            cursor: not-allowed;
            border-color: transparent;
        }
        
        .time-slot.available {
            background: rgba(134, 239, 172, 0.3);
            border-color: var(--success);
        }
        
        /* Empty State */
        .empty-state {
            text-align: center;
            padding: 48px 24px;
            color: var(--text-muted);
        }
        
        .empty-state .icon {
            font-size: 64px;
            margin-bottom: 16px;
            opacity: 0.5;
        }
        
        .empty-state p {
            font-size: 16px;
            margin-bottom: 8px;
        }
        
        .empty-state .hint {
            font-size: 14px;
            color: var(--text-muted);
        }
        
        /* Alert */
        .alert {
            padding: 12px 16px;
            border-radius: 8px;
            margin: 16px;
            font-size: 14px;
        }
        
        .alert-success {
            background: var(--status-approved);
            color: var(--status-approved-text);
        }
        
        .alert-error {
            background: var(--status-declined);
            color: var(--status-declined-text);
        }
        
        .alert-warning {
            background: var(--status-new);
            color: var(--status-new-text);
        }
        
        /* Loading Spinner */
        .loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 24px;
        }
        
        .spinner {
            width: 48px;
            height: 48px;
            border: 4px solid var(--border-color);
            border-top-color: var(--primary-dark);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        /* Animations */
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
            animation: fadeIn 0.3s ease-out forwards;
        }
        
        /* Step Indicator */
        .step-indicator {
            display: flex;
            justify-content: center;
            gap: 8px;
            padding: 16px;
        }
        
        .step-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--border-color);
            transition: all 0.3s;
        }
        
        .step-dot.active {
            background: var(--accent-red);
            width: 24px;
            border-radius: 4px;
        }
        
        .step-dot.completed {
            background: var(--success);
        }
        
        /* Success Screen */
        .success-screen {
            text-align: center;
            padding: 48px 24px;
        }
        
        .success-screen .icon {
            font-size: 80px;
            margin-bottom: 24px;
        }
        
        .success-screen h2 {
            font-size: 24px;
            font-weight: 600;
            color: var(--primary-dark);
            margin-bottom: 12px;
        }
        
        .success-screen p {
            font-size: 16px;
            color: var(--text-secondary);
            margin-bottom: 32px;
        }
        
        /* Tabs */
        .tabs {
            display: flex;
            margin: 16px;
            gap: 8px;
        }
        
        .tab {
            flex: 1;
            padding: 12px;
            text-align: center;
            background: var(--background);
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            font-size: 14px;
            color: var(--text-secondary);
            transition: all 0.2s;
            border: none;
            font-family: inherit;
        }
        
        .tab.active {
            background: var(--primary-dark);
            color: white;
        }
        
        /* Section Title */
        .section-title {
            font-size: 14px;
            font-weight: 500;
            color: var(--text-secondary);
            margin: 0 16px 12px;
        }
    </style>
    
    @livewireStyles
</head>
<body>
    {{ $slot }}
    
    @livewireScripts
    
    <script>
        // Initialize Telegram WebApp
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        
        // Apply Telegram theme colors if available
        if (tg.themeParams) {
            const root = document.documentElement;
            if (tg.themeParams.bg_color) {
                root.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color);
                root.style.setProperty('--background', tg.themeParams.bg_color);
            }
            if (tg.themeParams.text_color) {
                root.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color);
                root.style.setProperty('--text-primary', tg.themeParams.text_color);
            }
            if (tg.themeParams.button_color) {
                root.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color);
            }
            if (tg.themeParams.secondary_bg_color) {
                root.style.setProperty('--tg-theme-secondary-bg-color', tg.themeParams.secondary_bg_color);
                root.style.setProperty('--card-bg', tg.themeParams.secondary_bg_color);
            }
        }
        
        // Pass initData to Livewire for auth
        window.telegramInitData = tg.initData;
        window.telegramUser = tg.initDataUnsafe?.user;
        
        // Livewire event handlers
        document.addEventListener('livewire:initialized', () => {
            Livewire.on('close-webapp', () => {
                tg.close();
            });
            
            Livewire.on('show-alert', (data) => {
                tg.showAlert(data.message);
            });
            
            Livewire.on('show-main-button', (data) => {
                tg.MainButton.setText(data.text);
                tg.MainButton.show();
                tg.MainButton.onClick(() => {
                    Livewire.dispatch('main-button-clicked');
                });
            });
            
            Livewire.on('hide-main-button', () => {
                tg.MainButton.hide();
            });
            
            Livewire.on('set-main-button-loading', (data) => {
                if (data.loading) {
                    tg.MainButton.showProgress();
                } else {
                    tg.MainButton.hideProgress();
                }
            });
        });
    </script>
</body>
</html>
