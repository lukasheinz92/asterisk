// Fetches the effective GUI config (global config.json merged with any
// per-instance config-{instance}.json override) and applies it to the page.
export class GuiConfigManager {
    static DEFAULTS = {
        sidebarWidth: 240,
        searchEnabled: true
    };

    static get API_ENDPOINT() {
        const basePath = window.ASTERISK_BASE_PATH || '';
        return `${basePath}/api/config`;
    }

    static async loadAndApply() {
        let config = this.DEFAULTS;
        try {
            const response = await fetch(this.API_ENDPOINT);
            if (response.ok) {
                config = { ...this.DEFAULTS, ...(await response.json()) };
            }
        } catch (error) {
            console.error('Failed to load GUI config, using defaults:', error);
        }
        this.apply(config);
        return config;
    }

    static apply(config) {
        document.documentElement.style.setProperty('--sidebar-width', `${config.sidebarWidth}px`);

        const searchBox = document.querySelector('.search-box');
        if (searchBox) {
            searchBox.style.display = config.searchEnabled ? '' : 'none';
        }
    }
}
