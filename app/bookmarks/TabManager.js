// Tab management
import { DOMUtils } from '../utils/DOMUtils.js';

export default class TabManager {
    constructor(manager) {
        this.manager = manager;
    }

    populateTabList() {
        this.manager.elements.tabList.innerHTML = '';
        
        // Custom sort tabs with top/bottom priorities
        const sortedTabs = this.sortTabsWithCustomOrder();
        const groupedTabs = this.groupTabsByZone(sortedTabs);
        
        // Create group sections with separators (only between existing groups)
        let hasTopGroup = groupedTabs.topTabs.length > 0;
        let hasBottomGroup = groupedTabs.bottomTabs.length > 0;
        
        if (hasTopGroup) {
            this.createGroupSection('top', groupedTabs.topTabs);
            this.addGroupSeparator();
        }
        
        this.createGroupSection('alphabetical', groupedTabs.alphabeticalTabs);
        
        if (hasBottomGroup) {
            this.addGroupSeparator();
            this.createGroupSection('bottom', groupedTabs.bottomTabs);
        }
        
        // Setup SortableJS for drag and drop after DOM is ready
        setTimeout(() => this.setupSortable(), 100);
    }

    groupTabsByZone(sortedTabs) {
        const topTabs = [];
        const alphabeticalTabs = [];
        const bottomTabs = [];
        
        sortedTabs.forEach(tab => {
            const sortOrder = this.manager.getTabSortOrder(tab.name);
            if (sortOrder && sortOrder.startsWith('top-')) {
                topTabs.push(tab);
            } else if (sortOrder && sortOrder.startsWith('bottom-')) {
                bottomTabs.push(tab);
            } else {
                alphabeticalTabs.push(tab);
            }
        });
        
        return { topTabs, alphabeticalTabs, bottomTabs };
    }

    createGroupSection(groupType, tabs) {
        // Don't create empty groups for top/bottom
        if (tabs.length === 0 && groupType !== 'alphabetical') {
            return;
        }
        
        const tabList = this.manager.elements.tabList;
        
        // Create group container
        const groupContainer = DOMUtils.createElement('div', {
            className: `tab-group-container tab-group-${groupType}`,
            'data-group': groupType
        });
        
        // Add tabs if any exist
        tabs.forEach((tab) => {
            // Find original index for data operations
            const originalIndex = this.manager.getTabData().findIndex(t => t === tab);
            
            const li = DOMUtils.createElement('li', {
                textContent: tab.name,
                className: 'tab',
                'data-tab': tab.name,
                'data-tab-index': originalIndex.toString(),
                'data-type': 'tab',
                'data-group': groupType,
                'draggable': 'true'
            });
            
            // Add click event
            li.addEventListener('click', () => {
                this.manager.showTabBookmarks(tab);
            });
            
            // Add right-click event
            this.manager.eventHandler.addRightClickEvent(li, 'tab', { index: originalIndex });
            
            groupContainer.appendChild(li);
        });
        
        tabList.appendChild(groupContainer);
    }

    addGroupSeparator() {
        const separator = DOMUtils.createElement('div', {
            className: 'tab-group-separator'
        });
        this.manager.elements.tabList.appendChild(separator);
    }

    getGroupTitle(groupType, tabCount) {
        switch (groupType) {
            case 'top':
                return `Top (${tabCount})`;
            case 'alphabetical':
                return `Alphabetical (${tabCount})`;
            case 'bottom':
                return `Bottom (${tabCount})`;
            default:
                return '';
        }
    }

    getGroupDescription(groupType, tabCount) {
        switch (groupType) {
            case 'top':
                return tabCount > 0 ? 'Fixed at top position' : 'Drag here for top position';
            case 'alphabetical':
                return 'Sorted alphabetically by name';
            case 'bottom':
                return tabCount > 0 ? 'Fixed at bottom position' : 'Drag here for bottom position';
            default:
                return '';
        }
    }

    setupSortable() {
        // Check if SortableJS is available
        if (typeof Sortable === 'undefined') {
            console.error('SortableJS library not loaded! Drag and drop will not work.');
            return;
        }
        
        console.log('SortableJS is available, setting up drag and drop');
        
        // Clean up any existing sortable instances
        if (this.sortableInstances) {
            this.sortableInstances.forEach(instance => {
                try {
                    instance.destroy();
                } catch (e) {
                    // Ignore if already destroyed
                }
            });
        }
        this.sortableInstances = [];
        
        // Setup sortable for each group container
        const containers = document.querySelectorAll('.tab-group-container');
        console.log('Setting up SortableJS on', containers.length, 'containers');
        
        containers.forEach(container => {
            const groupType = container.getAttribute('data-group');
            console.log('Setting up sortable for group:', groupType);
            
            let sortableOptions = {
                group: 'tabs',
                animation: 150,
                ghostClass: 'sortable-ghost',
                chosenClass: 'sortable-chosen',
                dragClass: 'sortable-drag',
                filter: '.empty-drop-zone', // Don't make empty zones draggable
                onStart: (evt) => {
                    console.log('Drag started:', evt.item.getAttribute('data-tab'));
                    this.showDynamicDropZones();
                },
                onEnd: (evt) => {
                    console.log('Drag ended:', evt.item.getAttribute('data-tab'), 'to group:', groupType);
                    this.hideDynamicDropZones();
                    this.handleSortableMove(evt, groupType);
                }
            };
            
            // Disable internal sorting for alphabetical group but allow drops
            if (groupType === 'alphabetical') {
                sortableOptions.sort = false;
                sortableOptions.onAdd = (evt) => {
                    console.log('Added to alphabetical group:', evt.item.getAttribute('data-tab'));
                    this.handleSortableMove(evt, 'alphabetical');
                };
            }
            
            try {
                const sortableInstance = new Sortable(container, sortableOptions);
                this.sortableInstances.push(sortableInstance);
                console.log('Successfully created sortable for', groupType);
            } catch (error) {
                console.error('Failed to create sortable for', groupType, error);
            }
        });
        
        console.log('Total sortable instances created:', this.sortableInstances.length);
    }
    
    showDynamicDropZones() {
        const tabList = this.manager.elements.tabList;
        const groupedTabs = this.groupTabsByZone(this.sortTabsWithCustomOrder());
        
        // Add top drop zone if it doesn't exist
        if (groupedTabs.topTabs.length === 0) {
            const topDropZone = DOMUtils.createElement('div', {
                className: 'dynamic-drop-zone dynamic-drop-zone-top tab-group-container',
                'data-group': 'top'
            });
            tabList.insertBefore(topDropZone, tabList.firstChild);
            
            // Make it sortable
            const sortableInstance = new Sortable(topDropZone, {
                group: 'tabs',
                animation: 150,
                onEnd: (evt) => this.handleSortableMove(evt, 'top')
            });
            this.dynamicSortableInstances = this.dynamicSortableInstances || [];
            this.dynamicSortableInstances.push(sortableInstance);
        }
        
        // Add bottom drop zone if it doesn't exist
        if (groupedTabs.bottomTabs.length === 0) {
            const bottomDropZone = DOMUtils.createElement('div', {
                className: 'dynamic-drop-zone dynamic-drop-zone-bottom tab-group-container',
                'data-group': 'bottom'
            });
            tabList.appendChild(bottomDropZone);
            
            // Make it sortable
            const sortableInstance = new Sortable(bottomDropZone, {
                group: 'tabs',
                animation: 150,
                onEnd: (evt) => this.handleSortableMove(evt, 'bottom')
            });
            this.dynamicSortableInstances = this.dynamicSortableInstances || [];
            this.dynamicSortableInstances.push(sortableInstance);
        }
    }
    
    hideDynamicDropZones() {
        // Remove dynamic drop zones
        document.querySelectorAll('.dynamic-drop-zone').forEach(zone => zone.remove());
        
        // Clean up sortable instances
        if (this.dynamicSortableInstances) {
            this.dynamicSortableInstances.forEach(instance => {
                try {
                    instance.destroy();
                } catch (e) {
                    // Ignore if already destroyed
                }
            });
            this.dynamicSortableInstances = [];
        }
    }
    
    handleSortableMove(evt, targetGroup) {
        const tabElement = evt.item;
        const tabName = tabElement.getAttribute('data-tab');
        
        console.log('handleSortableMove called:', {
            tabName,
            targetGroup,
            oldIndex: evt.oldIndex,
            newIndex: evt.newIndex,
            from: evt.from?.getAttribute('data-group'),
            to: evt.to?.getAttribute('data-group')
        });
        
        if (!tabName) {
            console.error('No tab name found on dragged element');
            return;
        }
        
        // Get the actual target group from the destination container
        const actualTargetGroup = evt.to?.getAttribute('data-group') || targetGroup;
        console.log('Actual target group:', actualTargetGroup);
        
        // Remove any existing sort order first
        if (this.manager.config.tabSortOrder && this.manager.config.tabSortOrder[tabName]) {
            delete this.manager.config.tabSortOrder[tabName];
        }
        
        if (actualTargetGroup === 'alphabetical') {
            // For alphabetical group, no sort order needed (it will be sorted alphabetically)
            console.log('Moving', tabName, 'to alphabetical group - removing sort order');
        } else {
            // For top/bottom groups, calculate position based on the new index
            const newIndex = evt.newIndex;
            const newSortOrder = `${actualTargetGroup}-${newIndex + 1}`;
            console.log('Setting sort order for', tabName, 'to', newSortOrder);
            this.manager.setTabSortOrder(tabName, newSortOrder);
        }
        
        // Normalize all positions to ensure consecutive numbering
        this.normalizeTabPositions();
        
        // Refresh the display to show the changes
        console.log('Refreshing tab list after move');
        this.manager.refreshTabList();
    }
    
    getTabsInGroup(groupType) {
        const tabs = this.manager.getTabData();
        return tabs.filter(tab => {
            const sortOrder = this.manager.config.tabSortOrder?.[tab.name];
            if (groupType === 'top') {
                return sortOrder && sortOrder.startsWith('top-');
            } else if (groupType === 'bottom') {
                return sortOrder && sortOrder.startsWith('bottom-');
            } else {
                return !sortOrder || (!sortOrder.startsWith('top-') && !sortOrder.startsWith('bottom-'));
            }
        });
    }
    
    normalizeTabPositions() {
        if (!this.manager.config.tabSortOrder) {
            return;
        }

        const tabs = this.manager.getTabData();
        const topTabs = [];
        const bottomTabs = [];
        
        // Collect all tabs with their current sort orders
        tabs.forEach(tab => {
            const sortOrder = this.manager.config.tabSortOrder[tab.name];
            if (sortOrder && sortOrder.startsWith('top-')) {
                const position = parseInt(sortOrder.replace('top-', ''));
                topTabs.push({ tab, position, originalOrder: sortOrder });
            } else if (sortOrder && sortOrder.startsWith('bottom-')) {
                const position = parseInt(sortOrder.replace('bottom-', ''));
                bottomTabs.push({ tab, position, originalOrder: sortOrder });
            }
        });
        
        // Sort by current position to maintain relative order
        topTabs.sort((a, b) => a.position - b.position);
        bottomTabs.sort((a, b) => a.position - b.position);
        
        // Recalculate top positions starting from 1 (closes gaps)
        topTabs.forEach((item, index) => {
            const newPosition = `top-${index + 1}`;
            if (item.originalOrder !== newPosition) {
                this.manager.setTabSortOrder(item.tab.name, newPosition);
            }
        });
        
        // Recalculate bottom positions starting from 1 (closes gaps)
        bottomTabs.forEach((item, index) => {
            const newPosition = `bottom-${index + 1}`;
            if (item.originalOrder !== newPosition) {
                this.manager.setTabSortOrder(item.tab.name, newPosition);
            }
        });
    }

    sortTabsWithCustomOrder() {
        const tabs = [...this.manager.getTabData()];
        
        // Fallback to alphabetical if no sort order config
        if (!this.manager.config.tabSortOrder) {
            return tabs.sort((a, b) => a.name.localeCompare(b.name));
        }
        
        const tabSortOrder = this.manager.config.tabSortOrder;
        
        // Separate tabs into categories
        const topTabs = [];
        const bottomTabs = [];
        const alphabeticalTabs = [];
        
        tabs.forEach(tab => {
            const sortOrder = tabSortOrder[tab.name];
            if (sortOrder && typeof sortOrder === 'string') {
                if (sortOrder.startsWith('top-')) {
                    const position = parseInt(sortOrder.replace('top-', ''));
                    topTabs.push({ tab, position });
                } else if (sortOrder.startsWith('bottom-')) {
                    const position = parseInt(sortOrder.replace('bottom-', ''));
                    bottomTabs.push({ tab, position });
                } else {
                    alphabeticalTabs.push(tab);
                }
            } else {
                alphabeticalTabs.push(tab);
            }
        });
        
        // Sort each category
        topTabs.sort((a, b) => a.position - b.position);
        bottomTabs.sort((a, b) => a.position - b.position);
        alphabeticalTabs.sort((a, b) => a.name.localeCompare(b.name));
        
        // Combine: top tabs + alphabetical tabs + bottom tabs
        return [
            ...topTabs.map(item => item.tab),
            ...alphabeticalTabs,
            ...bottomTabs.map(item => item.tab)
        ];
    }

    updateActiveTab(tab) {
        // Remove active class from all tabs
        document.querySelectorAll('.tab').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to current tab
        const activeTab = document.querySelector(`.tab[data-tab="${tab.name}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
    }

    handleSubmit(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('Tab form submitted');
        const name = document.getElementById('clientName').value.trim();
        console.log('Tab name:', name);
        
        if (name) {
            const modalManager = this.manager.modalManager;
            
            if (modalManager.getIsEditing() && modalManager.getEditingData().type === 'tab') {
                // Edit existing tab
                const editData = modalManager.getEditingData();
                const tab = this.manager.getTabData()[editData.index];
                const oldName = tab.name;
                tab.name = name;
                
                // Remove any existing sort order for the old name
                if (this.manager.config.tabSortOrder && this.manager.config.tabSortOrder[oldName]) {
                    delete this.manager.config.tabSortOrder[oldName];
                }
                console.log('Edited existing tab');
            } else {
                // Add new tab
                const newTab = {
                    name: name,
                    groups: []
                };
                this.manager.getTabData().push(newTab);
                
                console.log('Added new tab:', newTab);
            }
            
            this.manager.refreshTabList();
            this.manager.modalManager.closeAllModals();
        }
        
        return false;
    }


    deleteTab(target) {
        const tabIndex = parseInt(target.getAttribute('data-tab-index'));
        this.manager.getTabData().splice(tabIndex, 1);
        
        this.manager.refreshTabList();
        
        // Show first available tab or empty state
        const tabData = this.manager.getTabData();
        if (tabData.length > 0) {
            this.manager.showTabBookmarks(tabData[0]);
        } else {
            this.manager.elements.bookmarkContainer.innerHTML = '';
            this.manager.elements.tabTitle.textContent = 'No tabs available';
        }
    }
}