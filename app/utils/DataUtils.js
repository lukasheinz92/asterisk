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
}
