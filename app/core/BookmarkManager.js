// Main BookmarkManager class - coordinates all modules
import EventHandler from './EventHandler.js';
import ModalManager from '../ui/ModalManager.js';
import ContextMenu from '../ui/ContextMenu.js';
import IconManager from '../ui/IconManager.js';
import TabSortManager from '../ui/TabSortManager.js';
import BookmarkRenderer from '../bookmarks/BookmarkRenderer.js';
import TabManager from '../bookmarks/TabManager.js';
import GroupManager from '../bookmarks/GroupManager.js';
import DragDropHandler from '../dragdrop/DragDropHandler.js';
import { DOMUtils } from '../utils/DOMUtils.js';
import { DataUtils } from '../utils/DataUtils.js';
import { FileStorageManager } from '../utils/FileStorageManager.js';

export default class BookmarkManager {
    constructor(config) {
        // Core data
        this.config = config;
        this.originalConfig = DataUtils.deepCopy(config);
        
        // Start with empty data - will be loaded in init()
        this.tabData = [];
        
        this.currentTab = null;
        this.contextTarget = null;
        
        // DOM elements
        this.elements = {
            tabList: document.getElementById('clientList'),
            tabTitle: document.getElementById('clientTitle'),
            bookmarkContainer: document.getElementById('bookmarkContainer'),
            searchInput: document.getElementById('searchInput'),
            addTabBtn: document.getElementById('addClientBtn')
        };
        
        // Initialize modules
        this.initializeModules();
        
        // Start the application
        this.init();
    }

    initializeModules() {
        try {
            console.log('Initializing modules...');
            
            // Initialize all modules and pass dependencies
            console.log('Creating EventHandler...');
            this.eventHandler = new EventHandler(this);
            
            console.log('Creating ModalManager...');
            this.modalManager = new ModalManager(this);
            
            console.log('Creating ContextMenu...');
            this.contextMenu = new ContextMenu(this);
            
            console.log('Creating IconManager...');
            this.iconManager = new IconManager(this);
            
            console.log('Creating BookmarkRenderer...');
            this.bookmarkRenderer = new BookmarkRenderer(this);
            
            console.log('Creating TabManager...');
            this.tabManager = new TabManager(this);
            
            console.log('Creating GroupManager...');
            this.groupManager = new GroupManager(this);
            
            console.log('Creating DragDropHandler...');
            this.dragDropHandler = new DragDropHandler(this);
            
            console.log('All modules initialized successfully');
        } catch (error) {
            console.error('Error in initializeModules:', error);
            throw error;
        }
    }


    async init() {
        try {
            console.log('BookmarkManager init started');
            
            // Load data from file first
            await this.loadDataFromFile();
            
            // Load icons
            await this.iconManager.loadAvailableIcons();
            console.log('Icons loaded');
            
            // Setup event listeners
            this.eventHandler.setupAllEvents();
            console.log('Events setup complete');
            
            // Populate initial data
            this.tabManager.populateTabList();
            console.log('Tab list populated, tabs:', this.tabData.length);
            
            this.setupSearch();
            
            // Show first tab if available
            if (this.tabData.length > 0) {
                this.showTabBookmarks(this.tabData[0]);
                console.log('Showing first tab');
            } else {
                // Show empty state
                this.elements.tabTitle.textContent = 'No tabs available';
                this.elements.bookmarkContainer.innerHTML = '<p style="text-align: center; color: #666; margin-top: 50px;">Click "Add New Tab" to get started</p>';
                console.log('Showing empty state');
            }
            
            console.log('BookmarkManager init complete');
        } catch (error) {
            console.error('Error initializing BookmarkManager:', error);
            console.error('Stack trace:', error.stack);
        }
    }

    async loadDataFromFile() {
        try {
            console.log('Loading data from file...');
            const savedData = await FileStorageManager.loadData();
            console.log('Received data from file:', savedData);
            
            if (savedData && savedData.tabs) {
                this.tabData = savedData.tabs;
                // Also update the config with the loaded tabSortOrder
                if (savedData.tabSortOrder) {
                    this.config.tabSortOrder = savedData.tabSortOrder;
                }
                console.log('Loaded data from file:', this.tabData.length, 'tabs');
                console.log('Tab sort order:', this.config.tabSortOrder);
            } else {
                // Start with empty data
                this.tabData = [];
                console.log('No valid data found, starting with empty data');
            }
        } catch (error) {
            console.error('Error loading data from file:', error);
            this.tabData = [];
        }
    }

    // Public methods used by modules
    showTabBookmarks(tab) {
        this.currentTab = tab;
        this.tabManager.updateActiveTab(tab);
        this.bookmarkRenderer.renderBookmarks(tab);
    }

    setupSearch() {
        this.elements.searchInput.addEventListener('input', () => {
            const searchValue = this.elements.searchInput.value.toLowerCase();
            document.querySelectorAll('.tab').forEach(tabEl => {
                const tabName = tabEl.textContent.toLowerCase();
                DOMUtils.toggleClass(tabEl, 'hidden', !tabName.includes(searchValue));
            });
        });
    }

    // Save data whenever changes are made
    async saveData() {
        const dataToSave = {
            tabSortOrder: this.config.tabSortOrder,
            tabs: this.tabData
        };
        await FileStorageManager.saveData(dataToSave);
    }

    showStorageInfo() {
        // Show a brief indicator that saved data was loaded
        const indicator = DOMUtils.createElement('div', {
            style: 'position: fixed; top: 10px; right: 10px; background: #4caf50; color: white; padding: 10px; border-radius: 4px; z-index: 1000;',
            textContent: 'Custom data loaded'
        });
        
        document.body.appendChild(indicator);
        setTimeout(() => indicator.remove(), 3000);
    }

    // Getters for module access
    getCurrentTab() {
        return this.currentTab;
    }

    getTabData() {
        return this.tabData;
    }

    getContextTarget() {
        return this.contextTarget;
    }

    setContextTarget(target) {
        this.contextTarget = target;
    }

    // Tab sort order methods
    getTabSortOrder(tabName) {
        if (!this.config.tabSortOrder) {
            return null;
        }
        return this.config.tabSortOrder[tabName];
    }

    setTabSortOrder(tabName, sortOrder) {
        if (!this.config.tabSortOrder) {
            this.config.tabSortOrder = {};
        }
        if (sortOrder) {
            this.config.tabSortOrder[tabName] = sortOrder;
        } else {
            delete this.config.tabSortOrder[tabName];
        }
    }

    // Refresh methods
    refreshTabList() {
        this.tabManager.populateTabList();
        this.saveData(); // Auto-save on changes
    }

    refreshCurrentTab() {
        if (this.currentTab) {
            this.showTabBookmarks(this.currentTab);
        }
        this.saveData(); // Auto-save on changes
    }
}