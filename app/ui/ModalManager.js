// Modal management system
import BookmarkRenderer from '../bookmarks/BookmarkRenderer.js';

export default class ModalManager {
    constructor(manager) {
        this.manager = manager;
        this.isEditing = false;
        this.editingData = {};
        
        // Modal elements
        this.modals = {
            tab: document.getElementById('clientModal'),
            group: document.getElementById('groupModal'),
            bookmark: document.getElementById('bookmarkModal')
        };
        
        console.log('ModalManager initialized with modals:', this.modals);
    }

    openTabModal(isEdit = false) {
        console.log('openTabModal called with isEdit:', isEdit);
        this.isEditing = isEdit;
        const title = document.getElementById('clientModalTitle');
        const nameInput = document.getElementById('clientName');
        
        console.log('Modal elements found:', { title, nameInput });
        
        if (!title || !nameInput) {
            console.error('Missing modal elements:', { title, nameInput });
            return;
        }
        
        title.textContent = isEdit ? 'Edit Tab' : 'Add New Tab';

        if (isEdit && this.manager.getContextTarget()) {
            const tabIndex = parseInt(this.manager.getContextTarget().getAttribute('data-tab-index'));
            const tab = this.manager.getTabData()[tabIndex];
            this.editingData = { type: 'tab', index: tabIndex };
            nameInput.value = tab.name;
        } else {
            this.editingData = {};
            nameInput.value = '';
        }

        this.captureSnapshot(['clientName']);

        console.log('Setting modal display to block');
        console.log('Modal element:', this.modals.tab);
        this.modals.tab.style.display = 'block';
        console.log('Modal display style after setting:', this.modals.tab.style.display);
    }

    openGroupModal(isEdit = false) {
        this.isEditing = isEdit;
        const title = document.getElementById('groupModalTitle');
        const nameInput = document.getElementById('groupName');
        
        title.textContent = isEdit ? 'Edit Group' : 'Add New Group';
        
        if (isEdit && this.manager.getContextTarget()) {
            const projectIndex = parseInt(this.manager.getContextTarget().getAttribute('data-project-index'));
            this.editingData = { type: 'group', projectIndex: projectIndex };
            nameInput.value = this.manager.getCurrentTab().groups[projectIndex].name;
        } else {
            this.editingData = {};
            nameInput.value = '';
        }

        this.captureSnapshot(['groupName']);

        this.modals.group.style.display = 'block';
    }

    async openBookmarkModal(projectIndex = null, isEdit = false) {
        console.log('openBookmarkModal called with:', { projectIndex, isEdit });
        this.isEditing = isEdit;
        this.currentProjectIndex = projectIndex;
        
        // Store context target data immediately before async operations
        let storedContextData = null;
        if (isEdit && this.manager.getContextTarget()) {
            const contextTarget = this.manager.getContextTarget();
            storedContextData = {
                projIndex: parseInt(contextTarget.getAttribute('data-project-index')),
                sysIndex: parseInt(contextTarget.getAttribute('data-system-index')),
                element: contextTarget
            };
            console.log('Stored context data:', storedContextData);
        }
        
        // Reload icons every time the modal opens to ensure fresh list
        await this.manager.iconManager.loadAvailableIcons();
        
        const title = document.getElementById('bookmarkModalTitle');
        const nameInput = document.getElementById('bookmarkName');
        const urlInput = document.getElementById('bookmarkUrl');
        const iconSelect = document.getElementById('bookmarkIcon');
        
        title.textContent = isEdit ? 'Edit Bookmark' : 'Add New Bookmark';
        
        if (isEdit && storedContextData) {
            console.log('Using stored context data for edit:', storedContextData);
            
            const projIndex = storedContextData.projIndex;
            const sysIndex = storedContextData.sysIndex;
            
            console.log('Parsed indices:', { projIndex, sysIndex });
            
            const currentTab = this.manager.getCurrentTab();
            console.log('Current tab:', currentTab);
            console.log('Groups:', currentTab?.groups);
            
            if (currentTab && currentTab.groups && currentTab.groups[projIndex] && currentTab.groups[projIndex].bookmarks) {
                const bookmark = currentTab.groups[projIndex].bookmarks[sysIndex];
                console.log('Found bookmark:', bookmark);
                
                this.editingData = { type: 'bookmark', projectIndex: projIndex, systemIndex: sysIndex };
                nameInput.value = bookmark.name || '';
                urlInput.value = bookmark.url || '';
                // bookmark.icon is stored base-path-relative (e.g. "data/icons/x.png"),
                // but <option> values include the instance base path - resolve to match.
                const resolvedIcon = BookmarkRenderer.resolveIconPath(bookmark.icon) || '';
                iconSelect.value = resolvedIcon;
                this.manager.iconManager.updateIconPreview(resolvedIcon);
                this.currentProjectIndex = projIndex;
            } else {
                console.error('Could not find bookmark data', { projIndex, sysIndex, currentTab });
            }
        } else {
            this.editingData = {};
            nameInput.value = '';
            urlInput.value = '';
            iconSelect.value = '';
            this.manager.iconManager.updateIconPreview('');
        }

        this.captureSnapshot(['bookmarkName', 'bookmarkUrl', 'bookmarkIcon']);

        this.modals.bookmark.style.display = 'block';
    }

    // Records current form field values so later edits can be detected.
    captureSnapshot(fieldIds) {
        this.snapshotFieldIds = fieldIds;
        this.initialFormValues = {};
        fieldIds.forEach(id => {
            const el = document.getElementById(id);
            this.initialFormValues[id] = el ? el.value : '';
        });
    }

    hasUnsavedChanges() {
        if (!this.snapshotFieldIds) return false;
        return this.snapshotFieldIds.some(id => {
            const el = document.getElementById(id);
            return el && el.value !== this.initialFormValues[id];
        });
    }

    isAnyModalOpen() {
        return Object.values(this.modals).some(modal => modal.style.display === 'block');
    }

    // Closes the open modal, confirming first if the form was edited.
    requestClose() {
        if (!this.isAnyModalOpen()) return;
        if (this.hasUnsavedChanges() && !window.confirm('Discard unsaved changes?')) {
            return;
        }
        this.closeAllModals();
    }

    closeAllModals() {
        Object.values(this.modals).forEach(modal => {
            modal.style.display = 'none';
        });
        this.isEditing = false;
        this.editingData = {};
        this.snapshotFieldIds = null;
        this.initialFormValues = {};
        this.manager.iconManager.updateIconPreview('');
    }

    // Getters for other modules
    getIsEditing() {
        return this.isEditing;
    }

    getEditingData() {
        return this.editingData;
    }

    getCurrentProjectIndex() {
        return this.currentProjectIndex;
    }
}