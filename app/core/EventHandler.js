// Central event management system
export default class EventHandler {
    constructor(manager) {
        this.manager = manager;
    }

    setupAllEvents() {
        this.setupMainButtons();
        this.setupGlobalEvents();
        this.setupModalEvents();
        this.setupContextMenuEvents();
    }

    setupMainButtons() {
        // Add tab button
        const addTabBtn = this.manager.elements.addTabBtn;
        console.log('Setting up add tab button:', addTabBtn);
        
        if (addTabBtn) {
            addTabBtn.addEventListener('click', () => {
                console.log('Add tab button clicked');
                this.manager.modalManager.openTabModal();
            });
        } else {
            console.error('Add tab button not found!');
        }
    }

    setupGlobalEvents() {
        // Hide context menu on click
        document.addEventListener('click', () => {
            this.manager.contextMenu.hide();
        });
        
        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.manager.modalManager.closeAllModals();
            }
        });
    }

    setupModalEvents() {
        // Tab modal events
        document.getElementById('cancelClientBtn').addEventListener('click', () => {
            this.manager.modalManager.closeAllModals();
        });
        
        document.getElementById('clientForm').addEventListener('submit', (e) => {
            this.manager.tabManager.handleSubmit(e);
        });

        // Group modal events
        document.getElementById('cancelGroupBtn').addEventListener('click', () => {
            this.manager.modalManager.closeAllModals();
        });
        
        document.getElementById('groupForm').addEventListener('submit', (e) => {
            this.manager.groupManager.handleSubmit(e);
        });

        // Bookmark modal events
        document.getElementById('cancelBookmarkBtn').addEventListener('click', () => {
            this.manager.modalManager.closeAllModals();
        });
        
        document.getElementById('bookmarkForm').addEventListener('submit', (e) => {
            this.manager.bookmarkRenderer.handleBookmarkSubmit(e);
        });
    }

    setupContextMenuEvents() {
        // Context menu actions
        document.getElementById('editOption').addEventListener('click', () => {
            this.manager.contextMenu.handleEdit();
        });
        
        document.getElementById('deleteOption').addEventListener('click', () => {
            this.manager.contextMenu.handleDelete();
        });
    }

    // Helper method to add right-click events
    addRightClickEvent(element, type, data = {}) {
        element.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.manager.setContextTarget(element);
            this.manager.contextMenu.show(e.clientX, e.clientY, type, data);
        });
    }
}