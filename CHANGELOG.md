# Changelog

## 2026-07-30

### Security

- Fixed a path traversal vulnerability in static/icon file serving that allowed arbitrary file reads via `..` in the URL. The server binds to `0.0.0.0`, so this was reachable from anything on the local network, not just `localhost`.

### Added

- GUI settings system: `data/config.json` with a `"global"` section plus an optional per-instance override section, currently backing sidebar width and search bar visibility.
- Drag-to-resize the sidebar width directly in the browser, saved as an override for that instance only.
- Settings button (gear icon, top-right of the page) opening a modal to toggle the search bar's visibility.
- "Copy Link" option in the bookmark right-click context menu, with a fallback for accessing the server over plain HTTP on the LAN (where the modern clipboard API is unavailable).
- Drag-and-drop reordering of bookmark groups within a tab (drag by the group title).
- Escape key and click-outside now close open modals, prompting for confirmation if the form has unsaved changes.
- Unified `setup.ps1` script replacing `setup.bat` / `setup-helper.js` / `stop-server.bat` / `remove-autostart.bat`: checks/installs Node.js, manages instances (add/remove), and controls autostart via a Windows Scheduled Task with crash-restart, instead of the old login-triggered VBS script.

### Fixed

- Bookmark icon dropdown showing blank when editing an existing bookmark (the stored icon path didn't include the instance base path that the dropdown's options used).
- Tab drag-and-drop into an empty top/bottom pinned zone not registering. The old code created a new SortableJS instance mid-drag, which is unreliable; top/bottom zones are now always rendered as stable, permanent drop targets.
- Tab drag-and-drop reordering within an already-populated top/bottom zone silently reverting to its previous order. The old code could produce two tabs with the same position number and then resolve the collision using an unrelated tie-break; positions are now derived directly from the real post-drop DOM order.
- Crash risk when a tab was named Home, Work, Tools, Personal, or Archive — a legacy numeric example `tabSortOrder` seed was incompatible with the current string-based sort format and a missing type check let it reach `.startsWith()`.
- Broken default bookmark icon reference (pointed at a file that was never created) and an icon-dropdown change listener that re-attached itself every time the bookmark modal opened.
- `setup.ps1` silently reporting success when Scheduled Task registration actually failed, now with a clear error and an offer to relaunch elevated.

### Changed

- Settings gear button moved from the sidebar header to a fixed position in the top-right corner of the page, then nudged left to clear the content area's own scrollbar.
- Settings icon now uses the provided `images/setting.png` instead of a Unicode glyph.
- Sidebar resize handle moved from an absolutely-positioned overlay (which visually conflicted with the sidebar's own scrollbar) to a proper sibling element between the sidebar and content.
- Empty top/bottom drop zones no longer show a "Drag here for top/bottom position" hint — kept as a small blank reserved space instead, so they still work as drop targets without announcing themselves.

### Removed

- Dead code: `TabSortManager`, `DragDropHandler`/`PlaceholderManager`, `StorageManager`, about 20 unused `DataUtils`/`DOMUtils` methods, and several orphaned CSS rules left over from earlier, superseded UI approaches.
- `normalizeTabPositions()` — superseded by deriving tab order directly from the DOM after a drag.
