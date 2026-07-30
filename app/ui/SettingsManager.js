// Settings modal submit handling
import { GuiConfigManager } from '../utils/GuiConfigManager.js';

export default class SettingsManager {
    constructor(manager) {
        this.manager = manager;
    }

    static get API_ENDPOINT() {
        const basePath = window.ASTERISK_BASE_PATH || '';
        return `${basePath}/api/config`;
    }

    async handleSubmit(e) {
        e.preventDefault();
        const searchEnabled = document.getElementById('settingsSearchEnabled').checked;

        try {
            await fetch(SettingsManager.API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ searchEnabled })
            });
            GuiConfigManager.applyPartial({ searchEnabled });
        } catch (error) {
            console.error('Failed to save settings:', error);
        }

        this.manager.modalManager.closeAllModals();
    }
}
