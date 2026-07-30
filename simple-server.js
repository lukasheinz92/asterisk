// Simple Node.js server with multi-instance bookmark API endpoint
const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const url = require('url');

const PORT = 8666;
const DATA_DIR = path.join(__dirname, 'data');
const INSTANCES_FILE = path.join(DATA_DIR, 'instances.json');
const OLD_DATA_FILE = path.join(DATA_DIR, 'bookmarks-data.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

// Reserved instance names that cannot be used
// ('global' is reserved because config.json uses it as the all-instances section key)
const RESERVED_NAMES = ['api', 'data', 'app', 'styles', 'images', 'icons', 'global'];

// GUI settings and their built-in fallback values. Effective config for an
// instance is DEFAULT_GUI_CONFIG <- config.json's "global" section <- its
// per-instance section, each layer only overriding the keys it defines.
const DEFAULT_GUI_CONFIG = {
    sidebarWidth: 240,
    searchEnabled: true
};

// Range enforced server-side for GUI settings written via POST /api/config
// (matches the client-side drag clamp in SidebarResizer.js as a safety net).
const SIDEBAR_WIDTH_MIN = 180;
const SIDEBAR_WIDTH_MAX = 500;

// Loaded instances configuration
let instances = [];

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

async function createDefaultIcon(iconsDir) {
    const defaultIconPath = path.join(iconsDir, '_BOOKMARK_.png');

    // Check if default icon already exists
    try {
        await fs.access(defaultIconPath);
        return; // Icon already exists
    } catch {
        // Icon doesn't exist, create it
    }

    // Base64 encoded 32x32 bookmark icon (blue bookmark with white bookmark symbol)
    const bookmarkIconBase64 = `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`;

    try {
        const iconBuffer = Buffer.from(bookmarkIconBase64, 'base64');
        await fs.writeFile(defaultIconPath, iconBuffer);
        console.log('Created default bookmark icon:', defaultIconPath);
    } catch (error) {
        console.error('Failed to create default icon:', error);
    }
}

async function ensureDataDirectory() {
    const iconsDir = path.join(DATA_DIR, 'icons');

    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }

    // Also ensure icons directory exists
    try {
        await fs.access(iconsDir);
    } catch {
        await fs.mkdir(iconsDir, { recursive: true });
        console.log('Created icons directory:', iconsDir);

        // Create default bookmark icon
        await createDefaultIcon(iconsDir);
    }

    // Seed the GUI config file so there's something to hand-edit
    try {
        await fs.access(CONFIG_FILE);
    } catch {
        await fs.writeFile(CONFIG_FILE, JSON.stringify({ global: DEFAULT_GUI_CONFIG }, null, 2));
        console.log('Created default config.json:', CONFIG_FILE);
    }
}

async function readJsonSafe(filePath) {
    try {
        const raw = await fs.readFile(filePath, 'utf8');
        return JSON.parse(raw);
    } catch {
        return {};
    }
}

// config.json holds a "global" section applied to all instances, plus one
// optional section per instance name - keys there override the same key
// under "global" for that instance only.
async function loadEffectiveConfig(instanceName) {
    const fullConfig = await readJsonSafe(CONFIG_FILE);
    const globalConfig = fullConfig.global || {};
    const instanceConfig = fullConfig[instanceName] || {};
    return { ...DEFAULT_GUI_CONFIG, ...globalConfig, ...instanceConfig };
}

// Migrate old data file if it exists
async function migrateOldDataFile() {
    try {
        await fs.access(OLD_DATA_FILE);
        const newFile = path.join(DATA_DIR, 'bookmarks-default.json');
        try {
            await fs.access(newFile);
            // New file already exists, don't overwrite
            console.log('Migration skipped: bookmarks-default.json already exists');
        } catch {
            // Rename old file to new format
            await fs.rename(OLD_DATA_FILE, newFile);
            console.log('Migrated bookmarks-data.json to bookmarks-default.json');
        }
    } catch {
        // Old file doesn't exist, nothing to migrate
    }
}

// Load instances configuration
async function loadInstances() {
    try {
        const data = await fs.readFile(INSTANCES_FILE, 'utf8');
        const config = JSON.parse(data);
        instances = config.instances || [];
        console.log('Loaded instances:', instances);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // No instances file, create default
            instances = ['default'];
            await saveInstances();
            console.log('Created default instances configuration');
        } else {
            console.error('Error loading instances:', error);
            instances = ['default'];
        }
    }
}

// Save instances configuration
async function saveInstances() {
    await ensureDataDirectory();
    await fs.writeFile(INSTANCES_FILE, JSON.stringify({ instances }, null, 2));
}

// Get data file path for an instance
function getDataFilePath(instanceName) {
    return path.join(DATA_DIR, `bookmarks-${instanceName}.json`);
}

// Check if instance name is valid
function isValidInstance(name) {
    return instances.includes(name) && !RESERVED_NAMES.includes(name.toLowerCase());
}

// Generate landing page HTML
function generateLandingPage() {
    // Sort instances alphabetically
    const sortedInstances = [...instances].sort((a, b) => a.localeCompare(b));

    const instanceLinks = sortedInstances.map(name =>
        `<a href="/${name}/" class="instance-item">${name}</a>`
    ).join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Asterisk - Bookmark Manager</title>
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #fff;
        }
        .container {
            text-align: center;
            padding: 2rem;
            width: 100%;
            max-width: 400px;
        }
        h1 {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
        }
        h1 img {
            width: 40px;
            height: 40px;
        }
        .subtitle {
            color: #8892b0;
            margin-bottom: 2rem;
            font-size: 1rem;
        }
        .instance-list {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        .instance-item {
            display: block;
            padding: 0.875rem 1.25rem;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            color: #fff;
            text-decoration: none;
            font-size: 1rem;
            transition: all 0.2s ease;
            text-align: left;
        }
        .instance-item:hover {
            background: rgba(255, 255, 255, 0.12);
            border-color: rgba(255, 255, 255, 0.25);
            transform: translateX(4px);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1><img src="/favicon.ico" alt="">Asterisk</h1>
        <p class="subtitle">Select a bookmark collection</p>
        <div class="instance-list">
            ${instanceLinks}
        </div>
    </div>
</body>
</html>`;
}

// Inject base path into index.html
async function serveIndexWithBasePath(res, basePath) {
    try {
        let html = await fs.readFile(path.join(__dirname, 'index.html'), 'utf8');

        // Inject base path script before other scripts
        const basePathScript = `<script>window.ASTERISK_BASE_PATH = '${basePath}';</script>`;
        html = html.replace('</head>', `${basePathScript}\n</head>`);

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    } catch (error) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading index.html');
    }
}

async function handleBookmarkAPI(req, res, instanceName) {
    const parsedUrl = url.parse(req.url, true);
    const dataFile = getDataFilePath(instanceName);

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    try {
        if (req.method === 'GET') {
            const action = parsedUrl.query.action;

            if (action === 'check') {
                // Check if file exists
                try {
                    await fs.access(dataFile);
                    res.writeHead(200);
                    res.end('{"exists": true}');
                } catch {
                    res.writeHead(404);
                    res.end('{"exists": false}');
                }
                return;
            }

            // Load data
            try {
                const data = await fs.readFile(dataFile, 'utf8');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(data);
            } catch (error) {
                if (error.code === 'ENOENT') {
                    // File doesn't exist, return default empty config
                    const defaultConfig = {
                        tabSortOrder: {},
                        tabs: []
                    };
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(defaultConfig));
                } else {
                    throw error;
                }
            }

        } else if (req.method === 'POST') {
            // Save data
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                try {
                    const requestData = JSON.parse(body);
                    const dataToSave = JSON.stringify(requestData.data, null, 2);

                    await ensureDataDirectory();
                    await fs.writeFile(dataFile, dataToSave);

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end('{"success": true}');
                } catch (error) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(`{"error": "${error.message}"}`);
                }
            });

        } else if (req.method === 'DELETE') {
            // Delete data file
            try {
                await fs.unlink(dataFile);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end('{"success": true}');
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(`{"error": "${error.message}"}`);
            }
        }

    } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(`{"error": "${error.message}"}`);
    }
}

async function handleConfigAPI(req, res, instanceName) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === 'GET') {
        try {
            const config = await loadEffectiveConfig(instanceName);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(config));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(`{"error": "${error.message}"}`);
        }
        return;
    }

    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const patch = JSON.parse(body);

                // Only accept known keys within sane ranges - never write
                // arbitrary client-supplied data into config.json.
                const updates = {};
                if (
                    typeof patch.sidebarWidth === 'number' &&
                    patch.sidebarWidth >= SIDEBAR_WIDTH_MIN &&
                    patch.sidebarWidth <= SIDEBAR_WIDTH_MAX
                ) {
                    updates.sidebarWidth = Math.round(patch.sidebarWidth);
                }
                if (typeof patch.searchEnabled === 'boolean') {
                    updates.searchEnabled = patch.searchEnabled;
                }

                if (Object.keys(updates).length === 0) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end('{"error": "No valid settings in request"}');
                    return;
                }

                // Written to this instance's own section only - other
                // instances and the "global" defaults are left untouched.
                const fullConfig = await readJsonSafe(CONFIG_FILE);
                fullConfig[instanceName] = { ...(fullConfig[instanceName] || {}), ...updates };
                await ensureDataDirectory();
                await fs.writeFile(CONFIG_FILE, JSON.stringify(fullConfig, null, 2));

                const effectiveConfig = await loadEffectiveConfig(instanceName);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(effectiveConfig));
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(`{"error": "${error.message}"}`);
            }
        });
        return;
    }

    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end('{"error": "Method not allowed"}');
}

// Resolves `segments` under `baseDir` and rejects anything that escapes it
// via ".." (URL path segments are attacker-controlled and are not stripped
// of ".." upstream, so this containment check is required before any fs read).
// Uses path.join (not path.resolve) to combine segments: path.resolve treats a
// segment starting with "/" as an absolute-path override (resetting to the
// drive root on Windows), which would make every request resolve outside baseDir.
function resolveSafePath(baseDir, ...segments) {
    const resolvedBase = path.resolve(baseDir);
    const resolvedPath = path.resolve(path.join(baseDir, ...segments));
    if (resolvedPath !== resolvedBase && !resolvedPath.startsWith(resolvedBase + path.sep)) {
        return null;
    }
    return resolvedPath;
}

async function serveFile(req, res, filePath) {
    try {
        const data = await fs.readFile(filePath);
        const ext = path.extname(filePath);
        const contentType = mimeTypes[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    } catch (error) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
    }
}

async function handleIconsAPI(req, res, basePath) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    try {
        const iconsDir = path.join(DATA_DIR, 'icons');
        const files = await fs.readdir(iconsDir);
        const pngFiles = files
            .filter(file => file.toLowerCase().endsWith('.png'))
            .sort();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(pngFiles));
    } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(`{"error": "${error.message}"}`);
    }
}

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // Root URL - serve landing page
    if (pathname === '/' || pathname === '') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(generateLandingPage());
        return;
    }

    // Serve favicon.ico from root
    if (pathname === '/favicon.ico') {
        await serveFile(req, res, path.join(__dirname, 'favicon.ico'));
        return;
    }

    // Extract first path segment as potential instance name
    const pathParts = pathname.split('/').filter(p => p);
    const firstSegment = pathParts[0];
    const remainingPath = '/' + pathParts.slice(1).join('/');

    // Check if first segment is a valid instance
    if (isValidInstance(firstSegment)) {
        const instanceName = firstSegment;
        const basePath = '/' + instanceName;

        // Redirect to add trailing slash if accessing instance root without it
        // This ensures relative paths in HTML resolve correctly
        if (pathParts.length === 1 && !pathname.endsWith('/')) {
            res.writeHead(302, { 'Location': `/${instanceName}/` });
            res.end();
            return;
        }

        // Handle instance root - serve index.html with injected base path
        if (remainingPath === '/' || remainingPath === '') {
            await serveIndexWithBasePath(res, basePath);
            return;
        }

        // Handle API routes
        if (remainingPath.startsWith('/api/bookmarks')) {
            await handleBookmarkAPI(req, res, instanceName);
            return;
        }

        if (remainingPath.startsWith('/api/icons')) {
            await handleIconsAPI(req, res, basePath);
            return;
        }

        if (remainingPath.startsWith('/api/config')) {
            await handleConfigAPI(req, res, instanceName);
            return;
        }

        // Handle data/icons directory listing
        if (remainingPath === '/data/icons/' || remainingPath === '/data/icons') {
            const iconsDir = path.join(DATA_DIR, 'icons');
            try {
                const files = await fs.readdir(iconsDir);
                const pngFiles = files.filter(file => file.endsWith('.png'));

                const html = `
                    <!DOCTYPE html>
                    <html><head><title>Icons Directory</title></head>
                    <body>
                    <h1>Icons Directory</h1>
                    ${pngFiles.map(file => `<a href="${basePath}/data/icons/${file}">${file}</a><br>`).join('')}
                    </body></html>
                `;

                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(html);
                return;
            } catch (error) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Icons directory not found');
                return;
            }
        }

        // Serve icon files from shared data/icons
        if (remainingPath.startsWith('/data/icons/')) {
            const iconFile = remainingPath.replace('/data/icons/', '');
            const iconFilePath = resolveSafePath(path.join(DATA_DIR, 'icons'), iconFile);
            if (!iconFilePath) {
                res.writeHead(403, { 'Content-Type': 'text/plain' });
                res.end('Forbidden');
                return;
            }
            await serveFile(req, res, iconFilePath);
            return;
        }

        // Serve static files (map instance path to root files)
        const staticFilePath = resolveSafePath(__dirname, remainingPath);
        if (!staticFilePath) {
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('Forbidden');
            return;
        }
        await serveFile(req, res, staticFilePath);
        return;
    }

    // Not a valid instance - return 404
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end(`
        <!DOCTYPE html>
        <html>
        <head><title>Not Found</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1>404 - Instance Not Found</h1>
            <p>The bookmark collection "${firstSegment}" does not exist.</p>
            <p><a href="/">Return to Home</a></p>
        </body>
        </html>
    `);
});

server.listen(PORT, async () => {
    // Ensure data and icons directories exist on startup
    await ensureDataDirectory();

    // Migrate old data file if exists
    await migrateOldDataFile();

    // Load instances configuration
    await loadInstances();

    console.log(`Server running at http://localhost:${PORT}/`);
    console.log('Available instances:');
    instances.forEach(name => {
        console.log(`  - http://localhost:${PORT}/${name}`);
    });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
