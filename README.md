# Asterisk - Bookmark Manager

A comprehensive bookmark manager that organizes your bookmarks into tabs and groups for easy access and management. Supports multiple instances for separating different bookmark collections.

## Description

Asterisk is a web-based bookmark manager that helps you organize your bookmarks using a hierarchical structure:
- **Instances**: Separate bookmark collections (e.g., personal, work)
- **Tabs**: Top-level containers for organizing bookmarks by category
- **Groups**: Sub-containers within tabs for further organization
- **Bookmarks**: Individual links with titles and optional icons

## Features

- **Multi-Instance Support**: Run multiple separate bookmark collections from a single installation
- **Tab Management**: Add, modify, and delete tabs to organize your bookmarks
- **Group Management**: Create groups within tabs for better categorization
- **Bookmark Management**: Add, modify, and delete individual bookmarks
- **Drag-and-Drop Reordering**:
  - Reorder tabs with three sections: Top, Default (alphabetical), and Bottom
  - Reorder bookmarks within tabs for custom organization
- **Icon Support**: Custom icons for bookmarks stored locally (shared across instances)
- **Local Data Storage**: All data saved locally in the `data` folder
- **GUI Configuration**: Global and per-instance settings (sidebar width, search bar visibility, more later)

## Data Storage

```
data/
├── instances.json           # Configuration: list of instance names
├── config.json               # GUI settings: "global" section + one optional section per instance
├── bookmarks-personal.json  # Bookmark data for "personal" instance
├── bookmarks-work.json      # Bookmark data for "work" instance
└── icons/                   # Shared icons for all instances
```

- **Instances Config**: `data/instances.json` contains the list of available instances
- **Bookmark Data**: Each instance has its own `bookmarks-{instance}.json` file
- **Icons**: Stored in `data/icons/` subfolder, shared across all instances
- **Manual Icon Downloads**: Icons (`.png`) must be downloaded manually from sources like [Dashboard Icons](https://dashboardicons.com/icons)

## GUI Configuration

One file, hand-edited as JSON: `data/config.json`. It has a `"global"` section applied to every instance, plus one optional section per instance name — any key set there overrides the same key under `"global"` for that instance only; keys not set anywhere fall back to the built-in defaults. Auto-created with just a `"global"` section (all defaults) on first server start.

Current settings:

| Key             | Type    | Default | Effect                          |
|-----------------|---------|---------|----------------------------------|
| `sidebarWidth`  | number  | `240`   | Width in pixels of the left tab panel |
| `searchEnabled` | boolean | `true`  | Shows/hides the tab search box    |

Example — every instance gets a 240px sidebar, except `work` which gets 400px with search disabled:

```json
{
  "global": { "sidebarWidth": 240, "searchEnabled": true },
  "work":   { "sidebarWidth": 400, "searchEnabled": false }
}
```

Note: `global` is a reserved instance name (it can't be used for a real instance, since it's this section key).

Changes take effect on browser reload — no server restart needed.

## Installation

1. Run `setup.ps1` to configure and start the bookmark manager (right-click → **Run with PowerShell**, or run `powershell -ExecutionPolicy Bypass -File setup.ps1` from a terminal):
   - Installs Node.js via winget if it isn't already present (with confirmation)
   - Prompts for instance names on first run (comma-separated, e.g., `personal,work`)
   - Presents a menu to add/remove instances, enable/disable autostart, and start/stop the server
2. Access the landing page at [http://localhost:8666/](http://localhost:8666/)
3. Select an instance to open its bookmark manager

## URL Structure

- `http://localhost:8666/` - Landing page listing all instances
- `http://localhost:8666/personal/` - Personal bookmarks instance
- `http://localhost:8666/work/` - Work bookmarks instance

## Usage

Run `setup.ps1` any time to manage the running installation via its menu:

- **Stop/Start Server**: option `[4]` toggles the server on demand
- **Remove Auto-start**: option `[3]` toggles autostart (implemented as a Windows Scheduled Task, `AsteriskBookmarkManager`, with automatic restart on crash)
- **Add/Remove Instance**: options `[1]`/`[2]` merge new instances with existing ones, or unlist an instance (optionally deleting its data file)

## Technical Details

- **Server Port**: 8666
- **Data Format**: Local JSON file-based storage
- **Platform**: Windows (PowerShell setup script)
- **Web Interface**: Accessible via any modern web browser
- **Reserved Instance Names**: `api`, `data`, `app`, `styles`, `images`, `icons` (cannot be used)

## Limitations

Current limitations that may be improved in future versions:

- **Manual Icon Management**: Icons must be downloaded manually and placed in the correct folder
- **Limited Search Functionality**: When enabled, search only works for tabs, not for individual bookmarks
- **Hand-Edited GUI Config**: No in-app settings panel yet — `config.json`/`config-{instance}.json` must be edited directly
- **Windows Only**: Currently only supports Windows platform (PowerShell + Scheduled Task setup)
- **Theme Options**: Only dark theme is available

## Getting Started

1. Run `setup.ps1` and enter your instance names (e.g., `personal,work`)
2. Open your browser and navigate to `http://localhost:8666/`
3. Select an instance from the list
4. Start adding tabs, groups, and bookmarks
5. Download icons from [Dashboard Icons](https://dashboardicons.com/icons) and place them in `data/icons/`
6. Organize your bookmarks using drag-and-drop functionality
