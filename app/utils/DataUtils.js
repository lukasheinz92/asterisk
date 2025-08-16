// Data manipulation utilities
export class DataUtils {
    
    // Deep copy an object or array
    static deepCopy(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        
        if (obj instanceof Array) {
            return obj.map(item => DataUtils.deepCopy(item));
        }
        
        if (typeof obj === 'object') {
            const copy = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    copy[key] = DataUtils.deepCopy(obj[key]);
                }
            }
            return copy;
        }
    }

    // Sort array by custom order
    static customSort(array, customOrder, defaultSort = 'alphabetical') {
        return array.sort((a, b) => {
            const aOrder = customOrder[a.name];
            const bOrder = customOrder[b.name];
            
            // Both have custom order
            if (aOrder !== undefined && bOrder !== undefined) {
                return aOrder - bOrder;
            }
            
            // Only a has custom order
            if (aOrder !== undefined) {
                return aOrder < 0 ? -1 : 1;
            }
            
            // Only b has custom order
            if (bOrder !== undefined) {
                return bOrder < 0 ? 1 : -1;
            }
            
            // Neither has custom order - use default sort
            if (defaultSort === 'alphabetical') {
                return a.name.localeCompare(b.name);
            }
            
            return 0;
        });
    }

    // Find item in nested structure
    static findInNested(array, predicate, childProperty = 'children') {
        for (const item of array) {
            if (predicate(item)) {
                return item;
            }
            
            if (item[childProperty] && Array.isArray(item[childProperty])) {
                const found = DataUtils.findInNested(item[childProperty], predicate, childProperty);
                if (found) {
                    return found;
                }
            }
        }
        return null;
    }

    // Validate URL
    static isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    // Sanitize string for HTML
    static sanitizeHtml(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    }

    // Generate unique ID
    static generateId(prefix = 'id') {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Debounce function
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Throttle function
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Check if object is empty
    static isEmpty(obj) {
        if (obj == null) return true;
        if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
        return Object.keys(obj).length === 0;
    }

    // Merge objects deeply
    static deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    result[key] = DataUtils.deepMerge(result[key] || {}, source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }
        
        return result;
    }

    // Format string for display
    static formatDisplayName(str) {
        return str
            .replace(/[_-]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase())
            .trim();
    }

    // Extract filename from path
    static getFilenameFromPath(path) {
        return path.split('/').pop().split('\\').pop();
    }

    // Remove file extension
    static removeExtension(filename) {
        return filename.substring(0, filename.lastIndexOf('.')) || filename;
    }
}