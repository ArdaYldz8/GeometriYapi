const jwt = require('jsonwebtoken');
const { getStore } = require('@netlify/blobs');

const JWT_SECRET = process.env.JWT_SECRET || 'geometri-yapi-jwt-secret-2024';

// Default content structure
const defaultContent = {
    "site": {
        "title": "GEOMETRİ YAPI",
        "logo": "GEOMETRİ YAPI",
        "phone": "+90 532 649 29 93",
        "email": "geometriyapi@gmail.com",
        "address": "Yıldız Turan Güneş Bulvarı 32/59 Çankaya, Ankara",
        "workingHours": "Pazartesi - Cuma: 09:00 - 18:00",
        "socialMedia": {
            "facebook": "#",
            "instagram": "#",
            "linkedin": "#",
            "twitter": "#"
        }
    },
    "home": {
        "hero": {
            "title": "GEOMETRİ YAPI PROJE",
            "subtitle": "Profesyonel mimarlık ve tasarım hizmetleri sunmaktayız.",
            "buttonText": "PROJELER",
            "buttonLink": "projeler.html",
            "backgroundImage": "images/hero1.jpg"
        },
        "about": {
            "subtitle": "HAKKIMIZDA",
            "title": "GEOMETRİ YAPI PROJE",
            "description": "Profesyonel ekibimiz ile işletmenize uygun benzersiz ve yaratıcı tasarım çözümlerinde size yardımcı olmaktadır.",
            "buttonText": "DAHA FAZLA",
            "buttonLink": "kurumsal.html",
            "image": "images/project1.jpg"
        },
        "cta": {
            "title": "Projenizi Hayata Geçirelim",
            "description": "Profesyonel ekibimizle hayalinizdeki projeyi gerçeğe dönüştürelim.",
            "buttonText": "İLETİŞİME GEÇİN",
            "buttonLink": "iletisim.html"
        }
    },
    "kurumsal": {
        "about": {
            "subtitle": "BİZ KİMİZ",
            "title": "GEOMETRİ YAPI PROJE",
            "paragraphs": [
                "Geometri PROJE olarak, profesyonel ekibimiz ile işletmenize uygun benzersiz ve yaratıcı tasarım çözümlerinde size yardımcı olmaktadır.",
                "İnşaat Proje ve İnşaat Uygulama alanlarında Metraj, Keşif, İhale Teklif Dosyası, Teknik Şartname ve İş Programı hazırlanması hizmetleri sunmaktayız."
            ],
            "image": "images/project1.jpg"
        },
        "stats": [
            { "number": "150+", "label": "TAMAMLANAN PROJE" },
            { "number": "50+", "label": "MUTLU MÜŞTERİ" },
            { "number": "25+", "label": "YIL DENEYİM" },
            { "number": "10+", "label": "UZMAN EKİP" }
        ],
        "missionVision": [
            { "icon": "fas fa-bullseye", "title": "MİSYONUMUZ", "description": "Kaliteli, güvenilir ve sürdürülebilir projeler üretmek." },
            { "icon": "fas fa-eye", "title": "VİZYONUMUZ", "description": "Sektörde lider ve güvenilen bir marka olmak." },
            { "icon": "fas fa-gem", "title": "DEĞERLERİMİZ", "description": "Dürüstlük, kalite, müşteri odaklılık." }
        ]
    },
    "projeler": {
        "items": [
            { "id": 1, "title": "Zenith Hotel", "location": "Girne, KKTC", "category": "hotel", "categoryLabel": "Otel", "image": "images/project1.jpg" },
            { "id": 2, "title": "Grand Casino", "location": "Batum, Gürcistan", "category": "commercial", "categoryLabel": "Ticari", "image": "images/project2.jpg" },
            { "id": 3, "title": "Sapphire Residence", "location": "İstanbul, Türkiye", "category": "residence", "categoryLabel": "Konut", "image": "images/project3.jpg" }
        ]
    },
    "iletisim": {
        "info": {
            "title": "BİZE ULAŞIN",
            "description": "Projeleriniz için bizimle iletişime geçebilirsiniz."
        },
        "form": { "buttonText": "MESAJ GÖNDER" },
        "mapEmbedUrl": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3060.4282746837384!2d32.8062!3d39.9016"
    },
    "footer": {
        "description": "Profesyonel mimarlık ve tasarım hizmetleri sunmaktayız.",
        "copyright": "© 2024 Geometri YAPI. Tüm hakları saklıdır."
    }
};

// Verify JWT token
function verifyToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    try {
        const token = authHeader.substring(7);
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        // Initialize Netlify Blobs store
        const store = getStore('content');

        // GET - Read content (public)
        if (event.httpMethod === 'GET') {
            try {
                const content = await store.get('site-content', { type: 'json' });
                if (content) {
                    return {
                        statusCode: 200,
                        headers,
                        body: JSON.stringify(content)
                    };
                }
            } catch (e) {
                // Blob doesn't exist yet, return default
            }

            // Return default content if not found
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(defaultContent)
            };
        }

        // PUT - Update content (requires auth)
        if (event.httpMethod === 'PUT') {
            const authHeader = event.headers.authorization || event.headers.Authorization;
            const user = verifyToken(authHeader);

            if (!user) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ error: 'Yetkisiz erişim' })
                };
            }

            const newContent = JSON.parse(event.body);

            // Save to Netlify Blobs
            await store.setJSON('site-content', newContent);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'İçerik başarıyla güncellendi!'
                })
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };

    } catch (error) {
        console.error('Content error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Sunucu hatası: ' + error.message })
        };
    }
};
