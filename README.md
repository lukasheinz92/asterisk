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

## Data Storage

```
data/
├── instances.json           # Configuration: list of instance names
├── bookmarks-personal.json  # Bookmark data for "personal" instance
├── bookmarks-work.json      # Bookmark data for "work" instance
└── icons/                   # Shared icons for all instances
```

- **Instances Config**: `data/instances.json` contains the list of available instances
- **Bookmark Data**: Each instance has its own `bookmarks-{instance}.json` file
- **Icons**: Stored in `data/icons/` subfolder, shared across all instances
- **Manual Icon Downloads**: Icons (`.png`) must be downloaded manually from sources like [Dashboard Icons](https://dashboardicons.com/icons)

## Installation

1. Run `setup.bat` to configure and start the bookmark manager:
   - Enter instance names when prompted (comma-separated, e.g., `personal,work`)
   - Press Enter to use existing instances with no changes
   - The script creates necessary data files and enables auto-start
2. Access the landing page at [http://localhost:8666/](http://localhost:8666/)
3. Select an instance to open its bookmark manager

## URL Structure

- `http://localhost:8666/` - Landing page listing all instances
- `http://localhost:8666/personal/` - Personal bookmarks instance
- `http://localhost:8666/work/` - Work bookmarks instance

## Usage

- **Stop Server**: Run `stop-server.bat` to stop the bookmark manager server
- **Remove Auto-start**: Run `remove-autostart.bat` to disable automatic server startup
- **Add New Instance**: Run `setup.bat` and enter new instance names (they will be merged with existing)

## Technical Details

- **Server Port**: 8666
- **Data Format**: Local JSON file-based storage
- **Platform**: Windows (batch file setup)
- **Web Interface**: Accessible via any modern web browser
- **Reserved Instance Names**: `api`, `data`, `app`, `styles`, `images`, `icons` (cannot be used)

## Limitations

Current limitations that may be improved in future versions:

- **Manual Icon Management**: Icons must be downloaded manually and placed in the correct folder
- **Fixed Tab Panel Width**: Tab panel has a fixed width that cannot be adjusted
- **Limited Search Functionality**: Search bar is always visible but only works for tabs, not for individual bookmarks
- **Windows Only**: Currently only supports Windows platform (batch file setup)
- **Theme Options**: Only dark theme is available

## Getting Started

1. Run `setup.bat` and enter your instance names (e.g., `personal,work`)
2. Open your browser and navigate to `http://localhost:8666/`
3. Select an instance from the list
4. Start adding tabs, groups, and bookmarks
5. Download icons from [Dashboard Icons](https://dashboardicons.com/icons) and place them in `data/icons/`
6. Organize your bookmarks using drag-and-drop functionality
