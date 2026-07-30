// Icon selection and preview management
export default class IconManager {
    constructor(manager) {
        this.manager = manager;
        this.availableIcons = [];

        // Attached once here rather than in populateIconDropdown(), which runs
        // every time the bookmark modal opens and would otherwise stack a new
        // listener on the same persistent <select> element each time.
        const iconSelect = document.getElementById('bookmarkIcon');
        if (iconSelect) {
            iconSelect.addEventListener('change', (e) => {
                this.updateIconPreview(e.target.value);
            });
        }
    }

    // Get base path for API calls
    static getBasePath() {
        return window.ASTERISK_BASE_PATH || '';
    }

    async loadAvailableIcons() {
        await this.scanIconsDirectory();
        this.populateIconDropdown();
    }

    async scanIconsDirectory() {
        try {
            const basePath = IconManager.getBasePath();
            console.log('Fetching icons from API...');
            const response = await fetch(`${basePath}/api/icons`);
            if (response.ok) {
                const icons = await response.json();
                console.log('Icons loaded from API:', icons.length, 'icons');
                this.availableIcons = icons.sort();
                return;
            } else {
                console.error('API request failed with status:', response.status);
                throw new Error(`API request failed with status: ${response.status}`);
            }
        } catch (error) {
            console.error('Failed to load icons from API:', error);
            // Set empty array as fallback
            this.availableIcons = [];
        }
    }

    populateIconDropdown() {
        const iconSelect = document.getElementById('bookmarkIcon');
        if (!iconSelect) {
            console.error('Bookmark icon select element not found');
            return;
        }

        const basePath = IconManager.getBasePath();
        console.log('Populating dropdown with', this.availableIcons.length, 'icons');

        iconSelect.innerHTML = '<option value="">Select an icon...</option>';

        // Sort icons alphabetically by display name
        const sortedIcons = this.availableIcons
            .map(icon => ({
                filename: icon,
                displayName: icon.replace('.png', '').replace(/[-_]/g, ' ')
            }))
            .sort((a, b) => a.displayName.localeCompare(b.displayName));

        sortedIcons.forEach(({ filename, displayName }) => {
            const option = document.createElement('option');
            // Store path with base path prefix
            option.value = `${basePath}/data/icons/${filename}`;
            option.textContent = displayName;
            iconSelect.appendChild(option);
        });
    }

    updateIconPreview(iconPath) {
        const preview = document.getElementById('iconPreview');
        const previewImg = document.getElementById('previewImg');
        const previewName = document.getElementById('previewName');

        if (!preview || !previewImg || !previewName) {
            console.warn('Icon preview elements not found');
            return;
        }

        if (iconPath) {
            previewImg.src = iconPath;
            previewName.textContent = iconPath.split('/').pop().replace('.png', '').replace(/[-_]/g, ' ');
            preview.style.display = 'flex';
        } else {
            preview.style.display = 'none';
        }
    }

    getAvailableIcons() {
        return this.availableIcons;
    }
}
