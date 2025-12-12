const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const JWT_SECRET = process.env.JWT_SECRET || 'geometri-yapi-jwt-secret-2024';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Initialize Supabase client
const supabase = SUPABASE_URL && SUPABASE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_KEY)
    : null;

// Default content structure (used as fallback)
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
        "services": {
            "sectionTitle": "HİZMETLERİMİZ",
            "items": [
                { "icon": "fas fa-drafting-compass", "title": "İnşaat Proje", "description": "Metraj, Keşif, İhale Teklif Dosyası ve Teknik Şartname Hazırlanması" },
                { "icon": "fas fa-hard-hat", "title": "İnşaat Uygulama", "description": "Birim Fiyat Analizleri, İş Programı ve Proje Yönetimi" },
                { "icon": "fas fa-building", "title": "Mimari Tasarım", "description": "Modern ve fonksiyonel mimari çözümler" }
            ]
        },
        "about": {
            "subtitle": "HAKKIMIZDA",
            "title": "GEOMETRİ YAPI PROJE",
            "description": "Profesyonel ekibimiz ile işletmenize uygun benzersiz ve yaratıcı tasarım çözümlerinde size yardımcı olmaktadır. İnşaat Proje ve İnşaat Uygulama alanlarında Metraj, Keşif, İhale Teklif Dosyası, Teknik Şartname ve İş Programı hazırlanması hizmetleri sunmaktayız.",
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
                "İnşaat Proje ve İnşaat Uygulama alanlarında Metraj, Keşif, İhale Teklif Dosyası, Teknik Şartname ve İş Programı hazırlanması hizmetleri sunmaktayız.",
                "25 yılı aşkın deneyimimiz ile müşterilerimize en kaliteli hizmeti sunmayı hedefliyoruz."
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
            { "icon": "fas fa-bullseye", "title": "MİSYONUMUZ", "description": "Kaliteli, güvenilir ve sürdürülebilir projeler üreterek müşteri memnuniyetini en üst düzeyde tutmak." },
            { "icon": "fas fa-eye", "title": "VİZYONUMUZ", "description": "Yenilikçi yaklaşımlarla sektörde lider olmak, ulusal ve uluslararası arenada tanınan bir marka olmak." },
            { "icon": "fas fa-gem", "title": "DEĞERLERİMİZ", "description": "Dürüstlük, kalite, müşteri odaklılık, yenilikçilik ve çevreye saygı temel değerlerimizdir." }
        ]
    },
    "projeler": {
        "items": [
            { "id": 1, "title": "Zenith Hotel", "location": "Girne, KKTC", "category": "hotel", "categoryLabel": "Otel", "image": "images/project1.jpg" },
            { "id": 2, "title": "Grand Casino", "location": "Batum, Gürcistan", "category": "commercial", "categoryLabel": "Ticari", "image": "images/project2.jpg" },
            { "id": 3, "title": "Sapphire Residence", "location": "İstanbul, Türkiye", "category": "residence", "categoryLabel": "Konut", "image": "images/project3.jpg" },
            { "id": 4, "title": "Corporate Tower", "location": "Ankara, Türkiye", "category": "commercial", "categoryLabel": "Ticari", "image": "images/project4.jpg" },
            { "id": 5, "title": "Luxury Spa Center", "location": "Antalya, Türkiye", "category": "hotel", "categoryLabel": "Otel", "image": "images/project5.jpg" },
            { "id": 6, "title": "Fine Dining Restaurant", "location": "İzmir, Türkiye", "category": "commercial", "categoryLabel": "Ticari", "image": "images/project6.jpg" }
        ]
    },
    "iletisim": {
        "info": {
            "title": "BİZE ULAŞIN",
            "description": "Projeleriniz için bizimle iletişime geçebilirsiniz. En kısa sürede size dönüş yapacağız."
        },
        "form": { "buttonText": "MESAJ GÖNDER" },
        "mapEmbedUrl": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3060.4282746837384!2d32.8062!3d39.9016!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMznCsDU0JzA2LjAiTiAzMsKwNDgnMjIuMCJF!5e0!3m2!1str!2str!4v1234567890"
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

// Get content from Supabase
async function getContent() {
    if (!supabase) {
        console.log('Supabase not configured, using default content');
        return defaultContent;
    }

    try {
        const { data, error } = await supabase
            .from('site_content')
            .select('content')
            .eq('id', 1)
            .single();

        if (error || !data) {
            console.log('No content in Supabase, using default');
            return defaultContent;
        }

        // Check if content is empty object
        if (!data.content || Object.keys(data.content).length === 0) {
            console.log('Content is empty, using default');
            return defaultContent;
        }

        return data.content;
    } catch (error) {
        console.error('Supabase read error:', error);
        return defaultContent;
    }
}

// Save content to Supabase
async function saveContent(content) {
    if (!supabase) {
        throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
        .from('site_content')
        .upsert({ id: 1, content: content, updated_at: new Date().toISOString() })
        .select();

    if (error) {
        throw error;
    }

    return data;
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
        // GET - Read content (public)
        if (event.httpMethod === 'GET') {
            const content = await getContent();
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(content)
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

            // Save to Supabase
            await saveContent(newContent);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'İçerik başarıyla kaydedildi!'
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
