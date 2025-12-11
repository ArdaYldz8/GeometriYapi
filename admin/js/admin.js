// ============================================
// ADMIN PANEL JAVASCRIPT - Geometri YAPI
// Netlify Functions Version with JWT Auth
// ============================================

const API_BASE = '/.netlify/functions';
let contentData = null;
let currentImageTarget = null;
let authToken = null;

// ============================================
// SECURITY UTILITIES
// ============================================

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    // Load token from localStorage
    authToken = localStorage.getItem('adminToken');
    checkAuth();
    setupEventListeners();
});

async function checkAuth() {
    if (!authToken) {
        showLogin();
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/check-auth`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const data = await response.json();

        if (data.authenticated) {
            showDashboard();
            loadContent();
            loadImages();
        } else {
            localStorage.removeItem('adminToken');
            authToken = null;
            showLogin();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        showLogin();
    }
}

function showLogin() {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('dashboard').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);

    // Toggle password visibility
    document.getElementById('togglePassword').addEventListener('click', function () {
        const passwordInput = document.getElementById('password');
        const icon = this.querySelector('i');
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', handleNavigation);
    });

    // Save button
    document.getElementById('saveAllBtn').addEventListener('click', saveContent);

    // Image upload
    const uploadArea = document.getElementById('uploadArea');
    const imageUpload = document.getElementById('imageUpload');

    uploadArea.addEventListener('click', () => imageUpload.click());
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#0f3460';
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '#dfe6e9';
    });
    uploadArea.addEventListener('drop', handleDrop);
    imageUpload.addEventListener('change', (e) => handleFileUpload(e.target.files[0]));

    // Image picker
    document.querySelectorAll('.btn-select-image').forEach(btn => {
        btn.addEventListener('click', () => openImagePicker(btn.dataset.target));
    });
    document.getElementById('closeImagePicker').addEventListener('click', closeImagePicker);

    // Add project button
    document.getElementById('addProjectBtn')?.addEventListener('click', addProject);

    // Add stat button
    document.getElementById('addStatBtn')?.addEventListener('click', addStat);
}

// ============================================
// AUTHENTICATION
// ============================================

async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('loginError');

    try {
        const response = await fetch(`${API_BASE}/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success && data.token) {
            // Store JWT token
            authToken = data.token;
            localStorage.setItem('adminToken', authToken);

            showDashboard();
            loadContent();
            loadImages();
            errorEl.classList.remove('show');
        } else {
            errorEl.textContent = data.error || 'Giriş başarısız!';
            errorEl.classList.add('show');
        }
    } catch (error) {
        errorEl.textContent = 'Bağlantı hatası!';
        errorEl.classList.add('show');
    }
}

function handleLogout() {
    // Clear token
    localStorage.removeItem('adminToken');
    authToken = null;
    showLogin();
}

// ============================================
// NAVIGATION
// ============================================

function handleNavigation(e) {
    e.preventDefault();

    // Update active nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    e.currentTarget.classList.add('active');

    // Show section
    const section = e.currentTarget.dataset.section;
    document.querySelectorAll('.editor-section').forEach(sec => {
        sec.classList.remove('active');
    });
    document.getElementById(`section-${section}`).classList.add('active');

    // Update title
    const titles = {
        'site': 'Site Ayarları',
        'home': 'Ana Sayfa',
        'kurumsal': 'Kurumsal',
        'projeler': 'Projeler',
        'iletisim': 'İletişim',
        'images': 'Görseller'
    };
    document.getElementById('sectionTitle').textContent = titles[section] || section;
}

// ============================================
// CONTENT MANAGEMENT
// ============================================

async function loadContent() {
    try {
        const response = await fetch(`${API_BASE}/content`);
        contentData = await response.json();
        populateFields();
        renderProjects();
        renderStats();
    } catch (error) {
        console.error('Content load error:', error);
        showToast('İçerik yüklenemedi!', 'error');
    }
}

function populateFields() {
    document.querySelectorAll('[data-path]').forEach(field => {
        const path = field.dataset.path;
        const value = getNestedValue(contentData, path);

        if (value !== undefined) {
            if (field.dataset.type === 'array') {
                field.value = Array.isArray(value) ? value.join('\n') : value;
            } else {
                field.value = value;
            }
        }
    });
}

function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
}

function setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
        if (!current[key]) current[key] = {};
        return current[key];
    }, obj);
    target[lastKey] = value;
}

async function saveContent() {
    // Collect all field values
    document.querySelectorAll('[data-path]').forEach(field => {
        const path = field.dataset.path;
        let value = field.value;

        if (field.dataset.type === 'array') {
            value = field.value.split('\n').filter(line => line.trim());
        }

        setNestedValue(contentData, path, value);
    });

    // Collect projects
    if (contentData.projeler) {
        contentData.projeler.items = collectProjects();
    }

    // Collect stats
    if (contentData.kurumsal) {
        contentData.kurumsal.stats = collectStats();
    }

    try {
        const response = await fetch(`${API_BASE}/content`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(contentData)
        });

        const data = await response.json();

        if (data.success) {
            showToast('İçerik başarıyla kaydedildi!');
        } else {
            showToast(data.error || 'Kaydetme hatası!', 'error');
        }
    } catch (error) {
        showToast('Bağlantı hatası!', 'error');
    }
}

// ============================================
// PROJECTS MANAGEMENT
// ============================================

function renderProjects() {
    const container = document.getElementById('projects-container');
    if (!container || !contentData.projeler) return;

    container.innerHTML = '';

    contentData.projeler.items.forEach((project, index) => {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
            <div class="item-card-header">
                <h4>Proje ${index + 1}</h4>
                <button type="button" class="btn-delete" onclick="deleteProject(${index})">
                    <i class="fas fa-trash"></i> Sil
                </button>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label>Proje Adı</label>
                    <input type="text" class="project-title" data-index="${index}" value="${escapeHtml(project.title || '')}">
                </div>
                <div class="form-group">
                    <label>Konum</label>
                    <input type="text" class="project-location" data-index="${index}" value="${escapeHtml(project.location || '')}">
                </div>
                <div class="form-group">
                    <label>Kategori</label>
                    <select class="project-category" data-index="${index}">
                        <option value="hotel" ${project.category === 'hotel' ? 'selected' : ''}>Otel</option>
                        <option value="residence" ${project.category === 'residence' ? 'selected' : ''}>Konut</option>
                        <option value="commercial" ${project.category === 'commercial' ? 'selected' : ''}>Ticari</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Görsel</label>
                    <div class="image-selector">
                        <input type="text" class="project-image" data-index="${index}" value="${project.image || ''}" readonly>
                        <button type="button" class="btn-select-image" onclick="openImagePicker('project-${index}')">
                            <i class="fas fa-image"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function collectProjects() {
    const projects = [];
    const titles = document.querySelectorAll('.project-title');

    titles.forEach((titleEl, index) => {
        const categoryEl = document.querySelector(`.project-category[data-index="${index}"]`);
        const categoryLabels = { hotel: 'Otel', residence: 'Konut', commercial: 'Ticari' };

        projects.push({
            id: index + 1,
            title: titleEl.value,
            location: document.querySelector(`.project-location[data-index="${index}"]`).value,
            category: categoryEl.value,
            categoryLabel: categoryLabels[categoryEl.value],
            image: document.querySelector(`.project-image[data-index="${index}"]`).value
        });
    });

    return projects;
}

function addProject() {
    if (!contentData.projeler) contentData.projeler = { items: [] };
    if (!contentData.projeler.items) contentData.projeler.items = [];

    contentData.projeler.items.push({
        id: contentData.projeler.items.length + 1,
        title: 'Yeni Proje',
        location: 'Konum',
        category: 'commercial',
        categoryLabel: 'Ticari',
        image: 'images/project1.jpg'
    });

    renderProjects();
}

function deleteProject(index) {
    if (confirm('Bu projeyi silmek istediğinize emin misiniz?')) {
        contentData.projeler.items.splice(index, 1);
        renderProjects();
    }
}

// ============================================
// STATS MANAGEMENT
// ============================================

function renderStats() {
    const container = document.getElementById('stats-container');
    if (!container || !contentData.kurumsal) return;

    container.innerHTML = '';

    contentData.kurumsal.stats.forEach((stat, index) => {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
            <div class="item-card-header">
                <h4>İstatistik ${index + 1}</h4>
                <button type="button" class="btn-delete" onclick="deleteStat(${index})">
                    <i class="fas fa-trash"></i> Sil
                </button>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label>Sayı</label>
                    <input type="text" class="stat-number" data-index="${index}" value="${escapeHtml(stat.number || '')}">
                </div>
                <div class="form-group">
                    <label>Etiket</label>
                    <input type="text" class="stat-label" data-index="${index}" value="${escapeHtml(stat.label || '')}">
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function collectStats() {
    const stats = [];
    const numbers = document.querySelectorAll('.stat-number');

    numbers.forEach((numEl, index) => {
        stats.push({
            number: numEl.value,
            label: document.querySelector(`.stat-label[data-index="${index}"]`).value
        });
    });

    return stats;
}

function addStat() {
    if (!contentData.kurumsal) contentData.kurumsal = { stats: [] };
    if (!contentData.kurumsal.stats) contentData.kurumsal.stats = [];

    contentData.kurumsal.stats.push({
        number: '0+',
        label: 'YENİ İSTATİSTİK'
    });

    renderStats();
}

function deleteStat(index) {
    if (confirm('Bu istatistiği silmek istediğinize emin misiniz?')) {
        contentData.kurumsal.stats.splice(index, 1);
        renderStats();
    }
}

// ============================================
// IMAGE MANAGEMENT
// ============================================

async function loadImages() {
    try {
        const response = await fetch(`${API_BASE}/images`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const images = await response.json();

        renderImageGrid('imagesGrid', images, true);
        renderImageGrid('imagePickerGrid', images, false);
    } catch (error) {
        console.error('Images load error:', error);
    }
}

function renderImageGrid(containerId, images, showDelete) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    images.forEach(image => {
        const div = document.createElement('div');
        div.className = 'image-item';
        div.innerHTML = `
            <img src="${image.path}" alt="${image.name}">
            <div class="image-overlay">${image.name}</div>
            ${showDelete && image.folder === 'uploads' ? `
                <button class="delete-image" onclick="deleteImage('${image.folder}', '${image.name}')">
                    <i class="fas fa-times"></i>
                </button>
            ` : ''}
        `;

        if (!showDelete) {
            div.addEventListener('click', () => selectImage(image.path));
        }

        container.appendChild(div);
    });
}

function handleDrop(e) {
    e.preventDefault();
    document.getElementById('uploadArea').style.borderColor = '#dfe6e9';

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        handleFileUpload(file);
    }
}

async function handleFileUpload(file) {
    if (!file) return;

    const progressEl = document.getElementById('uploadProgress');
    const progressFill = progressEl.querySelector('.progress-fill');

    progressEl.classList.remove('hidden');
    progressFill.style.width = '30%';

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = async function (e) {
        progressFill.style.width = '60%';

        try {
            const response = await fetch(`${API_BASE}/images`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    image: e.target.result,
                    filename: file.name
                })
            });

            const data = await response.json();
            progressFill.style.width = '100%';

            if (data.success) {
                showToast('Görsel başarıyla yüklendi!');
                loadImages();
            } else {
                showToast(data.error || 'Yükleme hatası!', 'error');
            }
        } catch (error) {
            showToast('Bağlantı hatası!', 'error');
        }

        setTimeout(() => {
            progressEl.classList.add('hidden');
            progressFill.style.width = '0%';
        }, 1000);
    };
    reader.readAsDataURL(file);
}

async function deleteImage(folder, filename) {
    if (!confirm('Bu görseli silmek istediğinize emin misiniz?')) return;

    try {
        const response = await fetch(`${API_BASE}/images/${folder}/${filename}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const data = await response.json();

        if (data.success) {
            showToast('Görsel silindi!');
            loadImages();
        } else {
            showToast(data.error || 'Silme hatası!', 'error');
        }
    } catch (error) {
        showToast('Bağlantı hatası!', 'error');
    }
}

// ============================================
// IMAGE PICKER
// ============================================

function openImagePicker(target) {
    currentImageTarget = target;
    document.getElementById('imagePickerModal').classList.remove('hidden');
}

function closeImagePicker() {
    document.getElementById('imagePickerModal').classList.add('hidden');
    currentImageTarget = null;
}

function selectImage(path) {
    if (!currentImageTarget) return;

    // Check if it's a project image
    if (currentImageTarget.startsWith('project-')) {
        const index = currentImageTarget.replace('project-', '');
        document.querySelector(`.project-image[data-index="${index}"]`).value = path;
    } else {
        document.getElementById(currentImageTarget).value = path;
    }

    closeImagePicker();
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');

    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Make functions globally available
window.deleteProject = deleteProject;
window.deleteStat = deleteStat;
window.deleteImage = deleteImage;
window.openImagePicker = openImagePicker;
