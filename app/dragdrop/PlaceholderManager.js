// Drop placeholder management
import { DOMUtils } from '../utils/DOMUtils.js';

export default class PlaceholderManager {
    constructor(manager) {
        this.manager = manager;
    }

    show(e, grid) {
        this.removeAll();
        
        const placeholder = DOMUtils.createElement('div', {
            className: 'drop-placeholder visible',
            textContent: 'Drop here'
        });
        
        const afterElement = this.getDragAfterElement(grid, e.clientY);
        if (afterElement == null) {
            grid.appendChild(placeholder);
        } else {
            grid.insertBefore(placeholder, afterElement);
        }
    }

    removeAll() {
        document.querySelectorAll('.drop-placeholder').forEach(p => p.remove());
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.bookmark:not(.dragging):not(.add-bookmark)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    getInsertionIndex(targetGrid) {
        const placeholder = targetGrid.querySelector('.drop-placeholder');
        let insertIndex = 0;
        
        if (placeholder) {
            const bookmarks = [...targetGrid.querySelectorAll('.bookmark:not(.add-bookmark):not(.drop-placeholder)')];
            const previousElement = placeholder.previousElementSibling;
            insertIndex = bookmarks.indexOf(previousElement) + 1;
        }
        
        return insertIndex;
    }
}