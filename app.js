// Main application entry point
console.log('App.js script starting...');

// Import BookmarkManager
import BookmarkManager from './app/core/BookmarkManager.js';

console.log('Imports successful');

// Default empty config - will be overridden by file data
const defaultConfig = {
    tabSortOrder: {
        "Home": -4,
        "Work": -3,
        "Tools": -2,
        "Personal": -1,
        "Archive": 999
    },
    tabs: []
};

console.log('Default config:', defaultConfig);

// Function to initialize the app
function initializeApp() {
    console.log('Initializing BookmarkManager...');
    try {
        console.log('About to create BookmarkManager...');
        const manager = new BookmarkManager(defaultConfig);
        console.log('BookmarkManager created successfully:', manager);
        
        // Add some test data if starting empty
        if (manager.getTabData().length === 0) {
            console.log('No tabs found, starting with empty state');
        }
    } catch (error) {
        console.error('Error creating BookmarkManager:', error);
        console.error('Stack trace:', error.stack);
        
        // Try to identify the specific issue
        console.log('Checking DOM elements:');
        console.log('clientList:', document.getElementById('clientList'));
        console.log('clientTitle:', document.getElementById('clientTitle'));
        console.log('addClientBtn:', document.getElementById('addClientBtn'));
    }
}

// Check if DOM is already loaded
console.log('Document ready state:', document.readyState);

if (document.readyState === 'loading') {
    // DOM hasn't finished loading yet
    console.log('DOM still loading, adding event listener');
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM is already loaded
    console.log('DOM already loaded, initializing immediately');
    initializeApp();
}

console.log('Initialization setup complete');