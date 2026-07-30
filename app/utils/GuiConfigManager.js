// Fetches the effective GUI config (config.json's "global" section merged
// with this instance's own section, if any) and applies it to the page.
export class GuiConfigManager {
    static DEFAULTS = {
        sidebarWidth: 240,
        searchEnabled: true
    };

    // Last-applied config, cached so other UI (e.g. the settings modal) can
    // read current values without an extra round trip.
    static currentConfig = null;

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
        this.currentConfig = config;
        this.apply(config);
        return config;
    }

    // Merges and applies a partial change (e.g. after a settings save)
    // without re-fetching the whole config from the server.
    static applyPartial(patch) {
        this.currentConfig = { ...(this.currentConfig || this.DEFAULTS), ...patch };
        this.apply(this.currentConfig);
    }

    static apply(config) {
        document.documentElement.style.setProperty('--sidebar-width', `${config.sidebarWidth}px`);

        const searchBox = document.querySelector('.search-box');
        if (searchBox) {
            searchBox.style.display = config.searchEnabled ? '' : 'none';
        }
    }
}
