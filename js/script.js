// ============================================
// GEOMETRI YAPI - Main Site JavaScript
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    // Load dynamic content from API
    loadSiteContent();

    // Header scroll effect
    const header = document.getElementById('header');

    window.addEventListener('scroll', function () {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');

    if (menuToggle) {
        menuToggle.addEventListener('click', function () {
            mainNav.classList.toggle('active');
        });
    }

    // Close menu when clicking a link
    const navLinks = document.querySelectorAll('.main-nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function () {
            mainNav.classList.remove('active');
        });
    });

    // Project filters
    setupProjectFilters();
});

// ============================================
// DYNAMIC CONTENT LOADING
// ============================================

async function loadSiteContent() {
    try {
        // Try Netlify Functions API first, fallback to local API
        let response = await fetch('/.netlify/functions/content');
        if (!response.ok) {
            response = await fetch('/api/content');
        }
        if (!response.ok) {
            console.log('API not available, using static content');
            return;
        }

        const content = await response.json();

        // Determine current page
        const currentPage = getCurrentPage();

        // Update site-wide content
        updateSiteContent(content.site);
        updateFooterContent(content.footer, content.site);

        // Update page-specific content
        switch (currentPage) {
            case 'index':
                updateHomeContent(content.home, content.projeler);
                break;
            case 'kurumsal':
                updateKurumsalContent(content.kurumsal);
                break;
            case 'projeler':
                updateProjelerContent(content.projeler);
                break;
            case 'iletisim':
                updateIletisimContent(content.iletisim, content.site);
                break;
        }

    } catch (error) {
        console.log('Using static content:', error.message);
    }
}

function getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('kurumsal')) return 'kurumsal';
    if (path.includes('projeler')) return 'projeler';
    if (path.includes('iletisim')) return 'iletisim';
    return 'index';
}

// ============================================
// CONTENT UPDATE FUNCTIONS
// ============================================

function updateSiteContent(site) {
    if (!site) return;

    // Update logo
    const logos = document.querySelectorAll('.logo, .footer-logo');
    logos.forEach(logo => {
        if (logo) logo.textContent = site.title || 'GEOMETRİ YAPI';
    });
}

function updateFooterContent(footer, site) {
    if (!footer || !site) return;

    // Update contact info in footer
    const contactList = document.querySelector('.footer-col .contact-list');
    if (contactList) {
        contactList.innerHTML = `
            <li><i class="fas fa-map-marker-alt"></i> ${site.address}</li>
            <li><i class="fas fa-phone"></i> ${site.phone}</li>
            <li><i class="fas fa-envelope"></i> ${site.email}</li>
        `;
    }

    // Update copyright
    const copyright = document.querySelector('.footer-bottom p');
    if (copyright) {
        copyright.textContent = footer.copyright;
    }
}

function updateHomeContent(home, projeler) {
    if (!home) return;

    // Update hero
    if (home.hero) {
        const heroTitle = document.querySelector('.hero-content h1');
        const heroSubtitle = document.querySelector('.hero-content p');
        const heroBtn = document.querySelector('.hero-content .btn');

        if (heroTitle) heroTitle.textContent = home.hero.title;
        if (heroSubtitle) heroSubtitle.textContent = home.hero.subtitle;
        if (heroBtn) heroBtn.textContent = home.hero.buttonText;
    }

    // Update about section
    if (home.about) {
        const aboutSubtitle = document.querySelector('.about-preview-text .subtitle');
        const aboutTitle = document.querySelector('.about-preview-text h2');
        const aboutDesc = document.querySelector('.about-preview-text p');
        const aboutBtn = document.querySelector('.about-preview-text .btn');
        const aboutImg = document.querySelector('.about-preview-image img');

        if (aboutSubtitle) aboutSubtitle.textContent = home.about.subtitle;
        if (aboutTitle) aboutTitle.textContent = home.about.title;
        if (aboutDesc) aboutDesc.textContent = home.about.description;
        if (aboutBtn) aboutBtn.textContent = home.about.buttonText;
        if (aboutImg && home.about.image) aboutImg.src = home.about.image;
    }

    // Update CTA section
    if (home.cta) {
        const ctaTitle = document.querySelector('.cta-section h2');
        const ctaDesc = document.querySelector('.cta-section p');
        const ctaBtn = document.querySelector('.cta-section .btn');

        if (ctaTitle) ctaTitle.textContent = home.cta.title;
        if (ctaDesc) ctaDesc.textContent = home.cta.description;
        if (ctaBtn) ctaBtn.textContent = home.cta.buttonText;
    }

    // Update home page projects grid
    if (projeler && projeler.items) {
        const homeProjectsGrid = document.querySelector('.projects-section .projects-grid');
        if (homeProjectsGrid) {
            homeProjectsGrid.innerHTML = '';
            projeler.items.forEach(project => {
                const card = document.createElement('div');
                card.className = 'project-card';
                card.innerHTML = `
                    <img src="${project.image}" alt="${project.title}">
                    <div class="overlay">
                        <h3>${project.title}</h3>
                        <p>${project.location}</p>
                    </div>
                `;
                homeProjectsGrid.appendChild(card);
            });
        }
    }
}

function updateKurumsalContent(kurumsal) {
    if (!kurumsal) return;

    // Update about section
    if (kurumsal.about) {
        const subtitle = document.querySelector('.about-section .subtitle');
        const title = document.querySelector('.about-section h2');
        const img = document.querySelector('.about-image img');

        if (subtitle) subtitle.textContent = kurumsal.about.subtitle;
        if (title) title.textContent = kurumsal.about.title;
        if (img && kurumsal.about.image) img.src = kurumsal.about.image;

        // Update paragraphs
        const paragraphContainer = document.querySelector('.about-content');
        if (paragraphContainer && kurumsal.about.paragraphs) {
            const existingP = paragraphContainer.querySelectorAll('p');
            kurumsal.about.paragraphs.forEach((text, i) => {
                if (existingP[i]) existingP[i].textContent = text;
            });
        }
    }

    // Update stats
    if (kurumsal.stats) {
        const statItems = document.querySelectorAll('.stat-item');
        kurumsal.stats.forEach((stat, i) => {
            if (statItems[i]) {
                const num = statItems[i].querySelector('.stat-number');
                const label = statItems[i].querySelector('.stat-label');
                if (num) num.textContent = stat.number;
                if (label) label.textContent = stat.label;
            }
        });
    }

    // Update mission/vision
    if (kurumsal.missionVision) {
        const mvCards = document.querySelectorAll('.mv-card');
        kurumsal.missionVision.forEach((item, i) => {
            if (mvCards[i]) {
                const title = mvCards[i].querySelector('h3');
                const desc = mvCards[i].querySelector('p');
                if (title) title.textContent = item.title;
                if (desc) desc.textContent = item.description;
            }
        });
    }
}

function updateProjelerContent(projeler) {
    if (!projeler || !projeler.items) return;

    const grid = document.querySelector('.projects-grid-full');
    if (!grid) return;

    grid.innerHTML = '';

    projeler.items.forEach(project => {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.setAttribute('data-category', project.category);
        card.innerHTML = `
            <img src="${project.image}" alt="${project.title}">
            <div class="overlay">
                <h3>${project.title}</h3>
                <p>${project.location}</p>
                <span class="category">${project.categoryLabel}</span>
            </div>
        `;
        grid.appendChild(card);
    });

    // Re-setup filters with new cards
    setupProjectFilters();
}

function updateIletisimContent(iletisim, site) {
    if (!iletisim || !site) return;

    // Update info
    if (iletisim.info) {
        const title = document.querySelector('.contact-info h2');
        const desc = document.querySelector('.contact-info > p');

        if (title) title.textContent = iletisim.info.title;
        if (desc) desc.textContent = iletisim.info.description;
    }

    // Update contact items
    const contactItems = document.querySelectorAll('.contact-item');
    if (contactItems.length >= 4) {
        // Address
        const addrP = contactItems[0].querySelector('p');
        if (addrP) addrP.innerHTML = site.address.replace(/, /g, '<br>');

        // Phone
        const phoneP = contactItems[1].querySelector('p');
        if (phoneP) phoneP.textContent = site.phone;

        // Email
        const emailP = contactItems[2].querySelector('p');
        if (emailP) emailP.textContent = site.email;

        // Working hours
        const hoursP = contactItems[3].querySelector('p');
        if (hoursP) hoursP.textContent = site.workingHours;
    }

    // Update map
    if (iletisim.mapEmbedUrl) {
        const mapIframe = document.querySelector('.map-section iframe');
        if (mapIframe) mapIframe.src = iletisim.mapEmbedUrl;
    }
}

// ============================================
// PROJECT FILTERS
// ============================================

function setupProjectFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.projects-grid-full .project-card');

    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                // Remove active class from all buttons
                filterBtns.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                this.classList.add('active');

                const filter = this.getAttribute('data-filter');

                projectCards.forEach(card => {
                    if (filter === 'all' || card.getAttribute('data-category') === filter) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    }
}
