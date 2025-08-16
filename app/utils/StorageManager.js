// Storage management for persisting changes
export class StorageManager {
    static STORAGE_KEY = 'bookmarkManagerData';
    
    // Save data to localStorage
    static saveData(data) {
        try {
            const jsonData = JSON.stringify(data, null, 2);
            localStorage.setItem(this.STORAGE_KEY, jsonData);
            console.log('Data saved to localStorage');
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            return false;
        }
    }
    
    // Load data from localStorage
    static loadData() {
        try {
            const jsonData = localStorage.getItem(this.STORAGE_KEY);
            if (jsonData) {
                const data = JSON.parse(jsonData);
                console.log('Data loaded from localStorage');
                return data;
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
        return null;
    }
    
    // Check if saved data exists
    static hasSavedData() {
        return localStorage.getItem(this.STORAGE_KEY) !== null;
    }
    
    // Clear saved data
    static clearData() {
        localStorage.removeItem(this.STORAGE_KEY);
        console.log('Saved data cleared');
    }
    
    // Reset to original configuration
    static resetToDefault(originalConfig) {
        this.clearData();
        return originalConfig.tabs;
    }
    
    // Export data as JSON file
    static exportData(data) {
        try {
            const jsonData = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `bookmarks-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            return true;
        } catch (error) {
            console.error('Error exporting data:', error);
            return false;
        }
    }
    
    // Import data from JSON file
    static importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    this.saveData(data);
                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('File reading failed'));
            reader.readAsText(file);
        });
    }
}