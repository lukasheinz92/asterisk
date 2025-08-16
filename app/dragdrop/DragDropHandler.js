// Drag and drop functionality
import PlaceholderManager from './PlaceholderManager.js';

export default class DragDropHandler {
    constructor(manager) {
        this.manager = manager;
        this.draggedElement = null;
        this.placeholderManager = new PlaceholderManager(manager);
    }

    setupDragAndDrop(element) {
        element.addEventListener('dragstart', (e) => {
            this.draggedElement = element;
            element.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        element.addEventListener('dragend', () => {
            element.classList.remove('dragging');
            this.placeholderManager.removeAll();
            this.draggedElement = null;
        });
    }

    setupDropZone(dropZone) {
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (this.draggedElement) {
                this.placeholderManager.show(e, dropZone);
            }
        });

        dropZone.addEventListener('dragleave', (e) => {
            // Only remove placeholder if leaving the grid entirely
            if (!dropZone.contains(e.relatedTarget)) {
                this.placeholderManager.removeAll();
            }
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            if (this.draggedElement) {
                this.handleBookmarkDrop(e, dropZone);
            }
            this.placeholderManager.removeAll();
        });
    }

    handleBookmarkDrop(e, targetGrid) {
        const sourceProjectIndex = parseInt(this.draggedElement.getAttribute('data-project-index'));
        const sourceSystemIndex = parseInt(this.draggedElement.getAttribute('data-system-index'));
        const targetProjectIndex = parseInt(targetGrid.getAttribute('data-project-index'));
        
        const currentTab = this.manager.getCurrentTab();
        
        // Get the bookmark data
        const sourceGroup = currentTab.groups[sourceProjectIndex];
        const bookmark = sourceGroup.bookmarks[sourceSystemIndex];
        
        // Remove from source
        sourceGroup.bookmarks.splice(sourceSystemIndex, 1);
        
        // Find insertion point in target
        const insertIndex = this.placeholderManager.getInsertionIndex(targetGrid);
        
        // Add to target at specific position
        const targetGroup = currentTab.groups[targetProjectIndex];
        targetGroup.bookmarks.splice(insertIndex, 0, bookmark);
        
        // Refresh display
        this.manager.refreshCurrentTab();
    }

    getDraggedElement() {
        return this.draggedElement;
    }
}