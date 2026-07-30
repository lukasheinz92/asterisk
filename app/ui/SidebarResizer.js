// Drag-to-resize handle for the left sidebar. Live-updates the width while
// dragging, then persists the final value as an override for this instance
// only (leaves the global default and other instances untouched).
export class SidebarResizer {
    static MIN_WIDTH = 180;
    static MAX_WIDTH = 500;

    static get API_ENDPOINT() {
        const basePath = window.ASTERISK_BASE_PATH || '';
        return `${basePath}/api/config`;
    }

    static init() {
        const handle = document.getElementById('sidebarResizeHandle');
        if (!handle) return;

        let startX = 0;
        let startWidth = 0;

        const onMouseMove = (e) => {
            const delta = e.clientX - startX;
            const newWidth = Math.min(
                SidebarResizer.MAX_WIDTH,
                Math.max(SidebarResizer.MIN_WIDTH, startWidth + delta)
            );
            document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`);
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            handle.classList.remove('resizing');
            document.body.classList.remove('resizing-sidebar');

            const finalWidth = parseInt(
                getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width'),
                10
            );
            SidebarResizer.saveWidth(finalWidth);
        };

        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            startX = e.clientX;
            startWidth = parseInt(
                getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width'),
                10
            );
            handle.classList.add('resizing');
            document.body.classList.add('resizing-sidebar');
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }

    static async saveWidth(sidebarWidth) {
        try {
            await fetch(SidebarResizer.API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sidebarWidth })
            });
        } catch (error) {
            console.error('Failed to save sidebar width:', error);
        }
    }
}
