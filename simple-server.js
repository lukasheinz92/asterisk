// Simple Node.js server with bookmark API endpoint
const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const url = require('url');

const PORT = 8666;
const DATA_FILE = path.join(__dirname, 'data', 'bookmarks-data.json');

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml'
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
    const dataDir = path.join(__dirname, 'data');
    const iconsDir = path.join(__dirname, 'data', 'icons');
    
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
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
}

async function handleBookmarkAPI(req, res) {
    const parsedUrl = url.parse(req.url, true);
    
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
                    await fs.access(DATA_FILE);
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
                const data = await fs.readFile(DATA_FILE, 'utf8');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(data);
            } catch (error) {
                if (error.code === 'ENOENT') {
                    // File doesn't exist, return default empty config
                    const defaultConfig = {
                        tabSortOrder: {
                            "Home": -4,
                            "Work": -3,
                            "Tools": -2,
                            "Personal": -1,
                            "Archive": 999
                        },
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
                    await fs.writeFile(DATA_FILE, dataToSave);
                    
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
                await fs.unlink(DATA_FILE);
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

async function serveFile(req, res) {
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    
    try {
        // Handle directory listing for /data/icons/
        if (req.url === '/data/icons/' || req.url === '/data/icons') {
            const iconsDir = path.join(__dirname, 'data', 'icons');
            try {
                const files = await fs.readdir(iconsDir);
                const pngFiles = files.filter(file => file.endsWith('.png'));
                
                // Generate simple HTML directory listing
                const html = `
                    <!DOCTYPE html>
                    <html><head><title>Icons Directory</title></head>
                    <body>
                    <h1>Icons Directory</h1>
                    ${pngFiles.map(file => `<a href="${file}">${file}</a><br>`).join('')}
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

async function handleIconsAPI(req, res) {
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
        const iconsDir = path.join(__dirname, 'data', 'icons');
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
    if (req.url.startsWith('/api/bookmarks')) {
        await handleBookmarkAPI(req, res);
    } else if (req.url.startsWith('/api/icons')) {
        await handleIconsAPI(req, res);
    } else {
        await serveFile(req, res);
    }
});

server.listen(PORT, async () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Bookmark data will be saved to: ${DATA_FILE}`);
    
    // Ensure data and icons directories exist on startup
    await ensureDataDirectory();
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});