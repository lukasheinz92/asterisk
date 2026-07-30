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

        // Top/bottom containers are always rendered (with a placeholder hint
        // when empty) so each has a real, permanent SortableJS instance to
        // drop onto - see setupSortable(). A container created only during
        // an active drag (the old approach) is not a reliable drop target.
        this.createGroupSection('top', groupedTabs.topTabs);
        this.addGroupSeparator();
        this.createGroupSection('alphabetical', groupedTabs.alphabeticalTabs);
        this.addGroupSeparator();
        this.createGroupSection('bottom', groupedTabs.bottomTabs);

        // Setup SortableJS for drag and drop after DOM is ready
        setTimeout(() => this.setupSortable(), 100);
    }

    groupTabsByZone(sortedTabs) {
        const topTabs = [];
        const alphabeticalTabs = [];
        const bottomTabs = [];
        
        sortedTabs.forEach(tab => {
            const sortOrder = this.manager.getTabSortOrder(tab.name);
            if (typeof sortOrder === 'string' && sortOrder.startsWith('top-')) {
                topTabs.push(tab);
            } else if (typeof sortOrder === 'string' && sortOrder.startsWith('bottom-')) {
                bottomTabs.push(tab);
            } else {
                alphabeticalTabs.push(tab);
            }
        });
        
        return { topTabs, alphabeticalTabs, bottomTabs };
    }

    createGroupSection(groupType, tabs) {
        const tabList = this.manager.elements.tabList;

        // Create group container
        const groupContainer = DOMUtils.createElement('div', {
            className: `tab-group-container tab-group-${groupType}`,
            'data-group': groupType
        });

        if (tabs.length === 0 && groupType !== 'alphabetical') {
            // Empty top/bottom zones still need to exist (and stay
            // droppable) - just reserve a small empty space, no hint text.
            groupContainer.classList.add('empty-drop-zone', `empty-drop-zone-${groupType}`);
            tabList.appendChild(groupContainer);
            return;
        }

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
                onStart: (evt) => {
                    console.log('Drag started:', evt.item.getAttribute('data-tab'));
                },
                onEnd: (evt) => {
                    console.log('Drag ended:', evt.item.getAttribute('data-tab'), 'to group:', groupType);
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

        // Get the actual target/source groups from the containers themselves
        const actualTargetGroup = evt.to?.getAttribute('data-group') || targetGroup;
        const sourceGroup = evt.from?.getAttribute('data-group');
        console.log('Actual target group:', actualTargetGroup);

        if (actualTargetGroup === 'alphabetical') {
            // No sort order needed - alphabetical sorting handles placement
            if (this.manager.config.tabSortOrder) {
                delete this.manager.config.tabSortOrder[tabName];
            }
        } else {
            // Derive positions from the real, final DOM order rather than a
            // computed index: SortableJS has already rearranged the <li>
            // elements to reflect the drop, so reading them back avoids ever
            // producing a position number that collides with another tab's
            // (a collision that a later "normalize" pass could resolve using
            // an order unrelated to what was just dragged, undoing the move).
            this.renumberZone(evt.to, actualTargetGroup);
        }

        // Cross-group move: close the gap left behind in the source zone
        if (evt.from && evt.from !== evt.to && sourceGroup && sourceGroup !== 'alphabetical') {
            this.renumberZone(evt.from, sourceGroup);
        }

        // Refresh the display to show the changes
        console.log('Refreshing tab list after move');
        this.manager.refreshTabList();
    }

    // Assigns "{groupType}-1", "{groupType}-2", ... to a zone's tabs based on
    // their actual current DOM order.
    renumberZone(container, groupType) {
        const names = [...container.querySelectorAll('.tab')].map(el => el.getAttribute('data-tab'));
        names.forEach((name, index) => {
            this.manager.setTabSortOrder(name, `${groupType}-${index + 1}`);
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