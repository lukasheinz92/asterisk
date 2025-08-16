// File-based storage management for saving to data folder
export class FileStorageManager {
    static DATA_FILE_PATH = '/data/bookmarks-data.json';
    static API_ENDPOINT = '/api/bookmarks';
    
    // Save data to file
    static async saveData(data) {
        try {
            const response = await fetch(this.API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'save',
                    data: data
                })
            });
            
            if (response.ok) {
                console.log('Data saved to file successfully');
                return true;
            } else {
                console.error('Failed to save data to file:', response.status);
                return false;
            }
        } catch (error) {
            console.error('Error saving data to file:', error);
            return false;
        }
    }
    
    // Load data from file
    static async loadData() {
        try {
            const response = await fetch(this.API_ENDPOINT + '?action=load');
            
            if (response.ok) {
                const data = await response.json();
                console.log('Data loaded from file successfully');
                return data;
            } else if (response.status === 404) {
                console.log('No saved data file found, using empty config');
                return null;
            } else {
                console.error('Failed to load data from file:', response.status);
                return null;
            }
        } catch (error) {
            console.error('Error loading data from file:', error);
            return null;
        }
    }
    
    // Check if saved data exists
    static async hasSavedData() {
        try {
            const response = await fetch(this.API_ENDPOINT + '?action=check');
            return response.ok;
        } catch (error) {
            return false;
        }
    }
    
    // Clear saved data
    static async clearData() {
        try {
            const response = await fetch(this.API_ENDPOINT, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                console.log('Saved data cleared');
                return true;
            } else {
                console.error('Failed to clear data');
                return false;
            }
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }
}