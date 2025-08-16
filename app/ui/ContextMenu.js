// Context menu management
export default class ContextMenu {
    constructor(manager) {
        this.manager = manager;
        this.contextMenu = document.getElementById('contextMenu');
    }

    show(x, y, type, data = {}) {
        this.contextMenu.style.display = 'block';
        this.contextMenu.style.left = x + 'px';
        this.contextMenu.style.top = y + 'px';
    }

    hide() {
        this.contextMenu.style.display = 'none';
        this.manager.setContextTarget(null);
    }

    async handleEdit() {
        console.log('ContextMenu.handleEdit() called');
        const target = this.manager.getContextTarget();
        console.log('Context target in handleEdit:', target);
        
        if (!target) {
            console.log('No context target found');
            return;
        }
        
        const type = target.getAttribute('data-type');
        console.log('Edit type:', type);
        
        // Hide context menu first, but don't clear context target yet
        this.contextMenu.style.display = 'none';
        
        switch (type) {
            case 'tab':
                console.log('Opening tab modal for edit');
                this.manager.modalManager.openTabModal(true);
                break;
            case 'group':
                console.log('Opening group modal for edit');
                this.manager.modalManager.openGroupModal(true);
                break;
            case 'bookmark':
                console.log('Opening bookmark modal for edit');
                await this.manager.modalManager.openBookmarkModal(null, true);
                break;
            default:
                console.log('Unknown edit type:', type);
        }
        
        // Clear context target after modal operations are complete
        this.manager.setContextTarget(null);
    }

    handleDelete() {
        const target = this.manager.getContextTarget();
        if (!target) return;
        
        const type = target.getAttribute('data-type');
        
        if (confirm(`Are you sure you want to delete this ${type}?`)) {
            switch (type) {
                case 'tab':
                    this.manager.tabManager.deleteTab(target);
                    break;
                case 'group':
                    this.manager.groupManager.deleteGroup(target);
                    break;
                case 'bookmark':
                    this.manager.bookmarkRenderer.deleteBookmark(target);
                    break;
            }
        }
        
        this.hide();
    }
}