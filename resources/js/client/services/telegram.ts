/// <reference path="../types/telegram.d.ts" />

class TelegramService {
    get webApp() {
        return (typeof window !== 'undefined' && window.Telegram?.WebApp)
            ? window.Telegram.WebApp
            : null;
    }

    constructor() {
        this.init();
    }

    private init() {
        if (!this.webApp) return;

        try {
            this.webApp.ready();
            this.webApp.expand();

            if (this.webApp.setHeaderColor) {
                this.webApp.setHeaderColor('#3c324c');
            }
            if (this.webApp.setBackgroundColor) {
                this.webApp.setBackgroundColor('#f8f9fa');
            }
            if (this.webApp.MainButton) {
                this.webApp.MainButton.setParams({
                    color: '#ed2e38',
                    text_color: '#ffffff',
                });
            }
        } catch (e) {
            console.error('Telegram WebApp init failed:', e);
        }
    }

    isAvailable(): boolean {
        return this.webApp !== null;
    }

    getUser() {
        // 1. Try to get user from Telegram WebApp
        if (this.webApp && this.webApp.initDataUnsafe?.user) {
            return this.webApp.initDataUnsafe.user;
        }

        // 2. If we are in Telegram (initData exists OR platform is known), DO NOT use mock.
        if (this.webApp && (this.webApp.initData || (this.webApp.platform && this.webApp.platform !== 'unknown'))) {
            console.error('Telegram: initData present or platform known but user is missing', this.webApp.initDataUnsafe);
            return null;
        }

        // 3. Only use mock/local storage if NOT in production AND NOT in Telegram context
        const isProduction = import.meta.env.PROD;

        try {
            const storedUser = localStorage.getItem('telegram_mock_user');
            if (storedUser) {
                return JSON.parse(storedUser);
            }
        } catch (e) {
            console.error('Error reading mock user from localStorage', e);
        }

        if (isProduction) {
            console.error('CRITICAL: Running in production but no Telegram user found!');
            return null;
        }

        const mockUser = {
            id: 888888888, // Constant mock ID for easier debugging
            first_name: 'Dev',
            last_name: 'Tester',
            username: 'dev_test',
        };

        try {
            localStorage.setItem('telegram_mock_user', JSON.stringify(mockUser));
        } catch (e) {
            console.error('Error saving mock user to localStorage', e);
        }

        return mockUser;
    }

    getInitData(): string {
        return this.webApp?.initData || '';
    }

    // MainButton methods
    showMainButton(text: string, onClick: () => void) {
        if (!this.webApp) return;

        this.webApp.MainButton.setText(text);
        this.webApp.MainButton.onClick(onClick);
        this.webApp.MainButton.show();
        this.webApp.MainButton.enable();
    }

    hideMainButton() {
        if (!this.webApp) return;
        this.webApp.MainButton.hide();
    }

    setMainButtonLoading(loading: boolean) {
        if (!this.webApp) return;

        if (loading) {
            this.webApp.MainButton.showProgress();
        } else {
            this.webApp.MainButton.hideProgress();
        }
    }

    enableMainButton() {
        if (!this.webApp) return;
        this.webApp.MainButton.enable();
    }

    disableMainButton() {
        if (!this.webApp) return;
        this.webApp.MainButton.disable();
    }

    // BackButton methods
    showBackButton(onClick: () => void) {
        if (!this.webApp) return;

        this.webApp.BackButton.onClick(onClick);
        this.webApp.BackButton.show();
    }

    hideBackButton() {
        if (!this.webApp) return;
        this.webApp.BackButton.hide();
    }

    // Utility methods
    close() {
        if (!this.webApp) return;
        this.webApp.close();
    }

    showAlert(message: string, callback?: () => void) {
        if (!this.webApp) {
            alert(message);
            callback?.();
            return;
        }
        this.webApp.showAlert(message, callback);
    }

    showConfirm(message: string, callback?: (confirmed: boolean) => void) {
        if (!this.webApp) {
            const confirmed = confirm(message);
            callback?.(confirmed);
            return;
        }
        this.webApp.showConfirm(message, callback);
    }

    openLink(url: string) {
        if (!this.webApp) {
            window.open(url, '_blank');
            return;
        }
        this.webApp.openLink(url);
    }

    enableClosingConfirmation() {
        if (!this.webApp) return;
        this.webApp.enableClosingConfirmation();
    }

    disableClosingConfirmation() {
        if (!this.webApp) return;
        this.webApp.disableClosingConfirmation();
    }
}

// Singleton instance
export const telegramService = new TelegramService();
