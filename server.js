const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const ASSETS = path.join(__dirname, 'assets');

// --- API: List all events ---
var coverOverrides = {
    'event1': 'IMG_0491.jpg',
    'event2': 'IMG_1792.jpg',
    'event4': 'IMG_2982.jpg',
    'event5': 'IMG_3311.jpg',
    'event6': '100_3009.jpg'
};

app.get('/api/events', function (req, res) {
    try {
        var dirs = fs.readdirSync(ASSETS)
            .filter(function (d) {
                var full = path.join(ASSETS, d);
                return d.startsWith('event') && fs.statSync(full).isDirectory();
            })
            .sort(function (a, b) {
                var numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
                var numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
                return numA - numB;
            });

        var events = dirs.map(function (dir, i) {
            var files = fs.readdirSync(path.join(ASSETS, dir))
                .filter(function (f) { return /\.(jpg|jpeg|png|webp)$/i.test(f); })
                .sort();
            var cover = coverOverrides[dir] || files[0] || null;
            return {
                slug: dir,
                name: 'Event ' + (i + 1),
                count: files.length,
                cover: cover
            };
        });

        res.json(events);
    } catch (err) {
        console.error('Error listing events:', err);
        res.status(500).json({ error: 'Failed to list events' });
    }
});

// --- API: List photos in one event ---
app.get('/api/events/:event', function (req, res) {
    try {
        var eventDir = path.basename(req.params.event);
        var dirPath = path.join(ASSETS, eventDir);
        if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
            return res.status(404).json({ error: 'Event not found' });
        }
        var files = fs.readdirSync(dirPath)
            .filter(function (f) { return /\.(jpg|jpeg|png|webp)$/i.test(f); })
            .sort();
        res.json({ slug: eventDir, photos: files });
    } catch (err) {
        console.error('Error listing photos:', err);
        res.status(500).json({ error: 'Failed to list photos' });
    }
});

// --- Serve photo ---
app.get('/photo/:event/:file', function (req, res) {
    var event = path.basename(req.params.event);
    var file = path.basename(req.params.file);
    var srcPath = path.join(ASSETS, event, file);

    if (!fs.existsSync(srcPath)) return res.status(404).send('Not found');
    res.sendFile(srcPath);
});

// --- Serve thumbnail (same as original) ---
app.get('/thumb/:event/:file', function (req, res) {
    var event = path.basename(req.params.event);
    var file = path.basename(req.params.file);
    var srcPath = path.join(ASSETS, event, file);

    if (!fs.existsSync(srcPath)) return res.status(404).send('Not found');
    res.sendFile(srcPath);
});

// --- Serve cover (same as original) ---
app.get('/cover/:event/:file', function (req, res) {
    var event = path.basename(req.params.event);
    var file = path.basename(req.params.file);
    var srcPath = path.join(ASSETS, event, file);

    if (!fs.existsSync(srcPath)) return res.status(404).send('Not found');
    res.sendFile(srcPath);
});

// --- Static files ---
app.use(express.static(path.join(__dirname)));

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/event', function (req, res) {
    res.sendFile(path.join(__dirname, 'event.html'));
});

app.get('/event.html', function (req, res) {
    res.sendFile(path.join(__dirname, 'event.html'));
});

app.get('*', function (req, res) {
    res.sendFile(path.join(__dirname, 'index.html'));
});

var PORT = 3050;
app.listen(PORT, function () {
    console.log('Manu Vidaurre Photography running at http://localhost:' + PORT);
});
