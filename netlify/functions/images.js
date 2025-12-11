const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'geometri-yapi-jwt-secret-2024';

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

// Static images list
const staticImages = [
    { name: 'hero1.jpg', path: '/images/hero1.jpg', folder: 'images' },
    { name: 'project1.jpg', path: '/images/project1.jpg', folder: 'images' },
    { name: 'project2.jpg', path: '/images/project2.jpg', folder: 'images' },
    { name: 'project3.jpg', path: '/images/project3.jpg', folder: 'images' },
    { name: 'project4.jpg', path: '/images/project4.jpg', folder: 'images' },
    { name: 'project5.jpg', path: '/images/project5.jpg', folder: 'images' },
    { name: 'project6.jpg', path: '/images/project6.jpg', folder: 'images' }
];

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        // GET - List all images (public)
        if (event.httpMethod === 'GET') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(staticImages)
            };
        }

        // All other operations require auth
        const authHeader = event.headers.authorization || event.headers.Authorization;
        const user = verifyToken(authHeader);

        if (!user) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Yetkisiz erişim' })
            };
        }

        // POST - Upload image (placeholder - would need Cloudinary for real uploads)
        if (event.httpMethod === 'POST') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Görsel yükleme özelliği henüz aktif değil. Mevcut görselleri kullanabilirsiniz.'
                })
            };
        }

        // DELETE - Remove image
        if (event.httpMethod === 'DELETE') {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Statik görseller silinemez' })
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };

    } catch (error) {
        console.error('Images error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Sunucu hatası: ' + error.message })
        };
    }
};
