// Tab sort order management
import { DOMUtils } from '../utils/DOMUtils.js';

export default class TabSortManager {
    constructor(manager) {
        this.manager = manager;
        this.modal = document.getElementById('tabSortModal');
        this.setupEvents();
    }

    setupEvents() {
        document.getElementById('sortTabsBtn').addEventListener('click', () => {
            this.openSortModal();
        });

        document.getElementById('cancelSortBtn').addEventListener('click', () => {
            this.closeSortModal();
        });

        document.getElementById('saveSortBtn').addEventListener('click', () => {
            this.saveSortOrder();
        });
    }

    openSortModal() {
        this.populateTabSortList();
        this.modal.style.display = 'block';
    }

    closeSortModal() {
        this.modal.style.display = 'none';
    }

    populateTabSortList() {
        const listContainer = document.getElementById('tabSortList');
        listContainer.innerHTML = '';

        this.manager.getTabData().forEach((tab, index) => {
            const currentSortOrder = this.manager.getTabSortOrder(tab.name);
            
            const tabItem = DOMUtils.createElement('div', {
                className: 'tab-sort-item',
                style: 'display: flex; align-items: center; padding: 10px; margin: 5px 0; background: #333; border-radius: 4px; gap: 10px;'
            });

            const tabName = DOMUtils.createElement('span', {
                textContent: tab.name,
                style: 'flex: 1; font-weight: 500;'
            });

            const sortSelect = DOMUtils.createElement('select', {
                'data-tab-name': tab.name,
                style: 'padding: 5px; border: 1px solid #555; background: #222; color: white; border-radius: 3px;'
            });

            // Populate sort options
            const options = [
                { value: '', text: 'Alphabetical' },
                { value: 'top-1', text: 'Top 1' },
                { value: 'top-2', text: 'Top 2' },
                { value: 'top-3', text: 'Top 3' },
                { value: 'top-4', text: 'Top 4' },
                { value: 'top-5', text: 'Top 5' },
                { value: 'bottom-1', text: 'Bottom 1' },
                { value: 'bottom-2', text: 'Bottom 2' },
                { value: 'bottom-3', text: 'Bottom 3' },
                { value: 'bottom-4', text: 'Bottom 4' },
                { value: 'bottom-5', text: 'Bottom 5' }
            ];

            options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.value;
                option.textContent = opt.text;
                if (opt.value === currentSortOrder) {
                    option.selected = true;
                }
                sortSelect.appendChild(option);
            });

            // Add visual indicator
            const indicator = DOMUtils.createElement('span', {
                textContent: currentSortOrder ? (currentSortOrder.includes('top') ? '📌' : '📍') : '📄',
                style: 'font-size: 16px;'
            });

            tabItem.appendChild(indicator);
            tabItem.appendChild(tabName);
            tabItem.appendChild(sortSelect);
            listContainer.appendChild(tabItem);
        });
    }

    saveSortOrder() {
        const selects = document.querySelectorAll('#tabSortList select');
        
        selects.forEach(select => {
            const tabName = select.getAttribute('data-tab-name');
            const sortOrder = select.value;
            this.manager.setTabSortOrder(tabName, sortOrder);
        });

        this.manager.refreshTabList();
        this.closeSortModal();
    }
}