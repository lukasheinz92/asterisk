// Setup helper script - handles instance configuration and file creation
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const INSTANCES_FILE = path.join(DATA_DIR, 'instances.json');
const RESERVED_NAMES = ['api', 'data', 'app', 'styles', 'images', 'icons'];

// Default bookmark config for new instances
const DEFAULT_BOOKMARK_CONFIG = {
    tabSortOrder: {
        "Home": -4,
        "Work": -3,
        "Tools": -2,
        "Personal": -1,
        "Archive": 999
    },
    tabs: []
};

// Ensure data directory exists
function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

// Load existing instances
function loadExistingInstances() {
    try {
        if (fs.existsSync(INSTANCES_FILE)) {
            const data = fs.readFileSync(INSTANCES_FILE, 'utf8');
            const config = JSON.parse(data);
            return config.instances || [];
        }
    } catch (error) {
        console.error('Error reading instances.json:', error.message);
    }
    return [];
}

// Save instances
function saveInstances(instances) {
    fs.writeFileSync(INSTANCES_FILE, JSON.stringify({ instances }, null, 2));
}

// Create bookmark file for instance if it doesn't exist
function ensureBookmarkFile(instanceName) {
    const bookmarkFile = path.join(DATA_DIR, `bookmarks-${instanceName}.json`);
    if (!fs.existsSync(bookmarkFile)) {
        fs.writeFileSync(bookmarkFile, JSON.stringify(DEFAULT_BOOKMARK_CONFIG, null, 2));
        console.log(`  Created: bookmarks-${instanceName}.json`);
        return true;
    } else {
        console.log(`  Exists:  bookmarks-${instanceName}.json`);
        return false;
    }
}

// Main setup function
function setup(newInstancesArg) {
    ensureDataDir();

    // Parse new instances from argument
    const newInstances = newInstancesArg
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(s => s.length > 0);

    // Validate instance names
    const invalidNames = newInstances.filter(name => RESERVED_NAMES.includes(name));
    if (invalidNames.length > 0) {
        console.error(`ERROR: Reserved names cannot be used: ${invalidNames.join(', ')}`);
        console.error(`Reserved names: ${RESERVED_NAMES.join(', ')}`);
        process.exit(1);
    }

    // Load existing instances
    const existingInstances = loadExistingInstances();
    console.log(`Existing instances: ${existingInstances.length > 0 ? existingInstances.join(', ') : '(none)'}`);

    // Merge instances (add new ones that don't exist)
    const addedInstances = [];
    const allInstances = [...existingInstances];

    for (const instance of newInstances) {
        if (!allInstances.includes(instance)) {
            allInstances.push(instance);
            addedInstances.push(instance);
        }
    }

    if (addedInstances.length > 0) {
        console.log(`Adding new instances: ${addedInstances.join(', ')}`);
    } else {
        console.log('No new instances to add (all already exist)');
    }

    // Save updated instances
    saveInstances(allInstances);
    console.log(`\nInstances saved to instances.json`);

    // Create bookmark files for all instances
    console.log(`\nChecking bookmark files:`);
    for (const instance of allInstances) {
        ensureBookmarkFile(instance);
    }

    // Output final list for setup.bat to use
    console.log(`\n===INSTANCES===`);
    console.log(allInstances.join(','));

    return allInstances;
}

// Get argument from command line
const args = process.argv.slice(2);
if (args.length === 0) {
    console.error('Usage: node setup-helper.js <instance-names>');
    console.error('Example: node setup-helper.js personal,work');
    process.exit(1);
}

setup(args[0]);
