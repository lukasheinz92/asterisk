// Group/Project management
export default class GroupManager {
    constructor(manager) {
        this.manager = manager;
    }

    handleSubmit(e) {
        e.preventDefault();
        const name = document.getElementById('groupName').value.trim();
        const currentTab = this.manager.getCurrentTab();
        
        if (name && currentTab) {
            const modalManager = this.manager.modalManager;
            
            if (modalManager.getIsEditing() && modalManager.getEditingData().type === 'group') {
                // Edit existing group
                const editData = modalManager.getEditingData();
                currentTab.groups[editData.projectIndex].name = name;
            } else {
                // Add new group
                if (!currentTab.groups) {
                    currentTab.groups = [];
                }
                currentTab.groups.push({
                    name: name,
                    bookmarks: []
                });
            }
            
            this.manager.refreshCurrentTab();
            this.manager.modalManager.closeAllModals();
        }
    }

    deleteGroup(target) {
        const projectIndex = parseInt(target.getAttribute('data-project-index'));
        this.manager.getCurrentTab().groups.splice(projectIndex, 1);
        this.manager.refreshCurrentTab();
    }
}