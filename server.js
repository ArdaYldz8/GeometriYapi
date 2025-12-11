const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: 'geometri-yapi-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Static files
app.use(express.static(path.join(__dirname)));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer configuration for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Sadece resim dosyaları yükleyebilirsiniz!'));
    }
});

// Admin credentials (change in production!)
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD_HASH = bcrypt.hashSync('geometri2024', 10);

// Helper functions
function getContentPath() {
    return path.join(__dirname, 'data', 'content.json');
}

function getContent() {
    const contentPath = getContentPath();
    if (!fs.existsSync(contentPath)) {
        return null;
    }
    const data = fs.readFileSync(contentPath, 'utf8');
    return JSON.parse(data);
}

function saveContent(content) {
    const contentPath = getContentPath();
    const dataDir = path.dirname(contentPath);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(contentPath, JSON.stringify(content, null, 2), 'utf8');
}

// Auth middleware
function requireAuth(req, res, next) {
    if (req.session && req.session.isAuthenticated) {
        return next();
    }
    res.status(401).json({ error: 'Yetkisiz erişim. Lütfen giriş yapın.' });
}

// ============================================
// AUTH ROUTES
// ============================================

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (username === ADMIN_USERNAME && bcrypt.compareSync(password, ADMIN_PASSWORD_HASH)) {
        req.session.isAuthenticated = true;
        req.session.username = username;
        res.json({ success: true, message: 'Giriş başarılı!' });
    } else {
        res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı!' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.status(500).json({ error: 'Çıkış yapılırken hata oluştu.' });
        } else {
            res.json({ success: true, message: 'Çıkış başarılı!' });
        }
    });
});

app.get('/api/check-auth', (req, res) => {
    if (req.session && req.session.isAuthenticated) {
        res.json({ authenticated: true, username: req.session.username });
    } else {
        res.json({ authenticated: false });
    }
});

// ============================================
// CONTENT ROUTES
// ============================================

// Get all content (public)
app.get('/api/content', (req, res) => {
    const content = getContent();
    if (!content) {
        res.status(404).json({ error: 'İçerik bulunamadı.' });
    } else {
        res.json(content);
    }
});

// Get specific page content (public)
app.get('/api/content/:page', (req, res) => {
    const content = getContent();
    const page = req.params.page;

    if (!content) {
        res.status(404).json({ error: 'İçerik bulunamadı.' });
    } else if (!content[page]) {
        res.status(404).json({ error: `${page} sayfası bulunamadı.` });
    } else {
        res.json(content[page]);
    }
});

// Update content (requires auth)
app.put('/api/content', requireAuth, (req, res) => {
    try {
        const newContent = req.body;
        saveContent(newContent);
        res.json({ success: true, message: 'İçerik başarıyla güncellendi!' });
    } catch (error) {
        res.status(500).json({ error: 'İçerik güncellenirken hata oluştu.' });
    }
});

// Update specific section (requires auth)
app.put('/api/content/:page', requireAuth, (req, res) => {
    try {
        const content = getContent() || {};
        const page = req.params.page;
        content[page] = req.body;
        saveContent(content);
        res.json({ success: true, message: `${page} başarıyla güncellendi!` });
    } catch (error) {
        res.status(500).json({ error: 'İçerik güncellenirken hata oluştu.' });
    }
});

// ============================================
// IMAGE ROUTES
// ============================================

// Get all images
app.get('/api/images', requireAuth, (req, res) => {
    const imagesDir = path.join(__dirname, 'images');
    const uploadsDir = path.join(__dirname, 'uploads');

    let images = [];

    // Get images from images folder
    if (fs.existsSync(imagesDir)) {
        const files = fs.readdirSync(imagesDir);
        files.forEach(file => {
            const ext = path.extname(file).toLowerCase();
            if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
                images.push({
                    name: file,
                    path: `/images/${file}`,
                    folder: 'images'
                });
            }
        });
    }

    // Get images from uploads folder
    if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        files.forEach(file => {
            const ext = path.extname(file).toLowerCase();
            if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
                images.push({
                    name: file,
                    path: `/uploads/${file}`,
                    folder: 'uploads'
                });
            }
        });
    }

    res.json(images);
});

// Upload image
app.post('/api/images/upload', requireAuth, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Dosya yüklenemedi.' });
    }

    res.json({
        success: true,
        message: 'Görsel başarıyla yüklendi!',
        file: {
            name: req.file.filename,
            path: `/uploads/${req.file.filename}`,
            size: req.file.size
        }
    });
});

// Delete image
app.delete('/api/images/:folder/:filename', requireAuth, (req, res) => {
    const { folder, filename } = req.params;

    if (!['images', 'uploads'].includes(folder)) {
        return res.status(400).json({ error: 'Geçersiz klasör.' });
    }

    const filePath = path.join(__dirname, folder, filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Dosya bulunamadı.' });
    }

    try {
        fs.unlinkSync(filePath);
        res.json({ success: true, message: 'Görsel başarıyla silindi!' });
    } catch (error) {
        res.status(500).json({ error: 'Dosya silinirken hata oluştu.' });
    }
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║           GEOMETRİ YAPI CMS SERVER                         ║
╠════════════════════════════════════════════════════════════╣
║  Server running at: http://localhost:${PORT}                  ║
║  Admin Panel: http://localhost:${PORT}/admin                  ║
║                                                            ║
║  Default Login:                                            ║
║  Username: admin                                           ║
║  Password: geometri2024                                    ║
╚════════════════════════════════════════════════════════════╝
    `);
});
