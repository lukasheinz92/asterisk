# Asterisk - Bookmark Manager

A comprehensive bookmark manager that organizes your bookmarks into tabs and groups for easy access and management.

## Description

Asterisk is a web-based bookmark manager that helps you organize your bookmarks using a hierarchical structure:
- **Tabs**: Top-level containers for organizing bookmarks by category
- **Groups**: Sub-containers within tabs for further organization
- **Bookmarks**: Individual links with titles and optional icons

## Features

- **Tab Management**: Add, modify, and delete tabs to organize your bookmarks
- **Group Management**: Create groups within tabs for better categorization
- **Bookmark Management**: Add, modify, and delete individual bookmarks
- **Drag-and-Drop Reordering**: 
  - Reorder tabs with three sections: Top, Default (alphabetical), and Bottom
  - Reorder bookmarks within tabs for custom organization
- **Icon Support**: Custom icons for bookmarks stored locally
- **Local Data Storage**: All data saved locally in the `data` folder

## Data Storage

- **Data Location**: All bookmark data is saved in the `data` folder
- **Icons**: Bookmark icons are stored in `data/icons` subfolder
- **Manual Icon Downloads**: Icons (`.png`) must be downloaded manually from sources like [Dashboard Icons](https://dashboardicons.com/icons)

## Installation

1. Run `setup.bat` to:
   - Start the bookmark manager server
   - Enable auto-start functionality
2. Access the web application at [http://localhost:8666/](http://localhost:8666/)

## Usage

- **Stop Server**: Run `stop-server.bat` to stop the bookmark manager server
- **Remove Auto-start**: Run `remove-autostart.bat` to disable automatic server startup

## Technical Details

- **Server Port**: 8666
- **Data Format**: Local file-based storage
- **Platform**: Windows (batch file setup)
- **Web Interface**: Accessible via any modern web browser

## Limitations

Current limitations that may be improved in future versions:

- **Manual Icon Management**: Icons must be downloaded manually and placed in the correct folder
- **Fixed Tab Panel Width**: Tab panel has a fixed width that cannot be adjusted
- **Limited Search Functionality**: Search bar is always visible but only works for tabs, not for individual bookmarks
- **Windows Only**: Currently only supports Windows platform (batch file setup)
- **Theme Options**: Only dark theme is available

## Getting Started

1. Run `setup.bat` to initialize the application
2. Open your browser and navigate to `http://localhost:8666/`
3. Start adding tabs, groups, and bookmarks
4. Download icons from [Dashboard Icons](https://dashboardicons.com/icons) and place them in `data/icons/`
5. Organize your bookmarks using drag-and-drop functionality
