// Bookmark rendering and management
import { DOMUtils } from '../utils/DOMUtils.js';

export default class BookmarkRenderer {
    constructor(manager) {
        this.manager = manager;
    }

    renderBookmarks(tab) {
        // Update title
        this.manager.elements.tabTitle.textContent = tab.name;

        // Clean up existing sortable instances
        this.cleanupSortableInstances();

        // Clear container
        this.manager.elements.bookmarkContainer.innerHTML = '';

        if (tab.groups) {
            tab.groups.forEach((group, groupIndex) => {
                this.createGroupSection(group, groupIndex);
            });
            
            // Add new group button
            this.addNewGroupButton();
        } else if (tab.bookmarks) {
            this.renderDirectBookmarks(tab);
        }
    }

    createGroupSection(group, groupIndex) {
        const groupSection = DOMUtils.createElement('div', { className: 'project-section' });
        
        // Group header
        const groupHeader = this.createGroupHeader(group, groupIndex);
        groupSection.appendChild(groupHeader);
        
        // Bookmark grid
        const grid = this.createBookmarkGrid(group, groupIndex);
        groupSection.appendChild(grid);
        
        this.manager.elements.bookmarkContainer.appendChild(groupSection);
    }

    createGroupHeader(group, groupIndex) {
        const groupHeader = DOMUtils.createElement('h3', {
            textContent: group.name,
            'data-type': 'group',
            'data-project-index': groupIndex.toString()
        });
        
        // Add right-click event
        this.manager.eventHandler.addRightClickEvent(groupHeader, 'group', { groupIndex });
        
        return groupHeader;
    }

    createBookmarkGrid(group, groupIndex) {
        const grid = DOMUtils.createElement('div', {
            className: 'bookmark-grid',
            'data-project-index': groupIndex.toString()
        });
        
        // Add bookmarks
        group.bookmarks.forEach((bookmark, bookmarkIndex) => {
            grid.appendChild(this.createBookmarkElement(bookmark, groupIndex, bookmarkIndex));
        });
        
        // Add "+" button
        grid.appendChild(this.createAddBookmarkElement(groupIndex));
        
        // Setup drag and drop using SortableJS
        this.setupBookmarkSortable(grid, groupIndex);
        
        return grid;
    }

    createBookmarkElement(bookmark, groupIndex, bookmarkIndex) {
        const bookmarkEl = DOMUtils.createElement('a', {
            href: bookmark.url,
            className: 'bookmark',
            target: '_blank',
            draggable: true,
            'data-type': 'bookmark',
            'data-project-index': groupIndex.toString(),
            'data-system-index': bookmarkIndex.toString()
        });
        
        // Create icon content
        let iconContent;
        if (bookmark.isImg) {
            iconContent = `<img src="${bookmark.icon}" alt="${bookmark.name} logo">`;
        } else {
            iconContent = bookmark.icon;
        }
        
        bookmarkEl.innerHTML = `
            <div class="bookmark-icon">${iconContent}</div>
            <div class="bookmark-name">${bookmark.name}</div>
        `;
        
        // Add events
        this.manager.eventHandler.addRightClickEvent(bookmarkEl, 'bookmark', { groupIndex, bookmarkIndex });
        // Note: Bookmark drag-drop within groups can be added later if needed
        
        return bookmarkEl;
    }

    createAddBookmarkElement(groupIndex) {
        const addBookmark = DOMUtils.createElement('div', {
            className: 'bookmark add-bookmark',
            textContent: '+'
        });
        
        addBookmark.addEventListener('click', async () => {
            await this.manager.modalManager.openBookmarkModal(groupIndex);
        });
        
        return addBookmark;
    }

    addNewGroupButton() {
        const addGroupBtn = DOMUtils.createElement('button', {
            className: 'add-group-btn',
            textContent: '+ Add New Group'
        });
        
        addGroupBtn.addEventListener('click', () => {
            this.manager.modalManager.openGroupModal();
        });
        
        this.manager.elements.bookmarkContainer.appendChild(addGroupBtn);
    }

    renderDirectBookmarks(tab) {
        const grid = DOMUtils.createElement('div', {
            className: 'bookmark-grid',
            'data-project-index': '0'
        });
        
        tab.bookmarks.forEach((bookmark, bookmarkIndex) => {
            grid.appendChild(this.createBookmarkElement(bookmark, 0, bookmarkIndex));
        });
        
        grid.appendChild(this.createAddBookmarkElement(0));
        
        // Setup drag and drop for direct bookmarks
        this.setupBookmarkSortable(grid, 0);
        
        this.manager.elements.bookmarkContainer.appendChild(grid);
    }

    cleanupSortableInstances() {
        // Clean up any existing sortable instances
        if (this.sortableInstances) {
            this.sortableInstances.forEach(instance => {
                try {
                    instance.destroy();
                } catch (e) {
                    // Ignore if already destroyed
                    console.log('Sortable instance already destroyed');
                }
            });
            this.sortableInstances = [];
        }
    }

    setupBookmarkSortable(grid, groupIndex) {
        // Check if SortableJS is available
        if (typeof Sortable === 'undefined') {
            console.error('SortableJS library not loaded! Bookmark drag and drop will not work.');
            return;
        }

        console.log('Setting up bookmark drag and drop for group:', groupIndex);

        const sortableInstance = new Sortable(grid, {
            group: 'bookmarks', // All bookmark grids share the same group for cross-group movement
            animation: 150,
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            filter: '.add-bookmark', // Don't make the add button draggable
            onStart: (evt) => {
                console.log('Bookmark drag started:', evt.item.getAttribute('data-system-index'));
            },
            onEnd: (evt) => {
                console.log('Bookmark drag ended:', {
                    oldIndex: evt.oldIndex,
                    newIndex: evt.newIndex,
                    fromGroup: evt.from.getAttribute('data-project-index'),
                    toGroup: evt.to.getAttribute('data-project-index')
                });
                this.handleBookmarkMove(evt);
            }
        });

        // Store the sortable instance for cleanup if needed
        if (!this.sortableInstances) {
            this.sortableInstances = [];
        }
        this.sortableInstances.push(sortableInstance);
    }

    handleBookmarkMove(evt) {
        const oldIndex = evt.oldIndex;
        const newIndex = evt.newIndex;
        const fromGroupIndex = parseInt(evt.from.getAttribute('data-project-index'));
        const toGroupIndex = parseInt(evt.to.getAttribute('data-project-index'));

        // Skip if no actual movement
        if (oldIndex === newIndex && fromGroupIndex === toGroupIndex) {
            return;
        }

        console.log(`Moving bookmark from group ${fromGroupIndex}[${oldIndex}] to group ${toGroupIndex}[${newIndex}]`);

        // Get the current tab
        const currentTab = this.manager.getCurrentTab();
        if (!currentTab) {
            console.error('No current tab');
            return;
        }

        let sourceBookmarksArray, targetBookmarksArray;
        
        // Handle different tab structures (with groups vs direct bookmarks)
        if (currentTab.groups) {
            // Tab with groups
            if (!currentTab.groups[fromGroupIndex] || !currentTab.groups[toGroupIndex]) {
                console.error('Invalid group indices');
                return;
            }
            sourceBookmarksArray = currentTab.groups[fromGroupIndex].bookmarks;
            targetBookmarksArray = currentTab.groups[toGroupIndex].bookmarks;
        } else if (currentTab.bookmarks && fromGroupIndex === 0 && toGroupIndex === 0) {
            // Tab with direct bookmarks (only within same "group")
            sourceBookmarksArray = currentTab.bookmarks;
            targetBookmarksArray = currentTab.bookmarks;
        } else {
            console.error('Invalid tab structure or cross-group movement not supported for direct bookmarks');
            return;
        }
        
        // Remove the bookmark from its old position
        const movedBookmark = sourceBookmarksArray.splice(oldIndex, 1)[0];
        
        // Insert it at the new position in the target group
        targetBookmarksArray.splice(newIndex, 0, movedBookmark);

        console.log('Bookmark moved successfully');
        
        // Save the changes
        this.manager.saveData();
        
        // Refresh the display to update data attributes
        this.manager.refreshCurrentTab();
    }

    handleBookmarkSubmit(e) {
        e.preventDefault();
        const name = document.getElementById('bookmarkName').value.trim();
        const url = document.getElementById('bookmarkUrl').value.trim();
        const icon = document.getElementById('bookmarkIcon').value.trim() || 'icons/default.png';
        
        if (name && url) {
            const bookmark = {
                name: name,
                url: url,
                icon: icon || 'data/icons/default.png',
                isImg: true
            };
            
            const modalManager = this.manager.modalManager;
            
            if (modalManager.getIsEditing() && modalManager.getEditingData().type === 'bookmark') {
                // Edit existing bookmark
                const editData = modalManager.getEditingData();
                this.manager.getCurrentTab().groups[editData.projectIndex].bookmarks[editData.systemIndex] = bookmark;
            } else {
                // Add new bookmark
                const groupIndex = modalManager.getCurrentProjectIndex();
                if (groupIndex !== null) {
                    this.manager.getCurrentTab().groups[groupIndex].bookmarks.push(bookmark);
                }
            }
            
            this.manager.refreshCurrentTab();
            this.manager.modalManager.closeAllModals();
        }
    }

    deleteBookmark(target) {
        const groupIndex = parseInt(target.getAttribute('data-project-index'));
        const bookmarkIndex = parseInt(target.getAttribute('data-system-index'));
        
        this.manager.getCurrentTab().groups[groupIndex].bookmarks.splice(bookmarkIndex, 1);
        this.manager.refreshCurrentTab();
    }
}