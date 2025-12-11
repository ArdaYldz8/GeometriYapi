const jwt = require('jsonwebtoken');
const { getStore } = require('@netlify/blobs');

const JWT_SECRET = process.env.JWT_SECRET || 'geometri-yapi-jwt-secret-2024';

// Cloudinary configuration (optional - for future use)
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

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
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // All image operations require auth
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const user = verifyToken(authHeader);

    if (!user && event.httpMethod !== 'GET') {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Yetkisiz erişim' })
        };
    }

    try {
        const store = getStore('images');

        // GET - List all images
        if (event.httpMethod === 'GET') {
            // Return static images list for now
            // In production, this would list from Cloudinary or Blobs
            const staticImages = [
                { name: 'hero1.jpg', path: '/images/hero1.jpg', folder: 'images' },
                { name: 'project1.jpg', path: '/images/project1.jpg', folder: 'images' },
                { name: 'project2.jpg', path: '/images/project2.jpg', folder: 'images' },
                { name: 'project3.jpg', path: '/images/project3.jpg', folder: 'images' },
                { name: 'project4.jpg', path: '/images/project4.jpg', folder: 'images' },
                { name: 'project5.jpg', path: '/images/project5.jpg', folder: 'images' },
                { name: 'project6.jpg', path: '/images/project6.jpg', folder: 'images' }
            ];

            // Try to get uploaded images list from Blobs
            try {
                const uploadedImages = await store.get('uploaded-images', { type: 'json' });
                if (uploadedImages && Array.isArray(uploadedImages)) {
                    return {
                        statusCode: 200,
                        headers,
                        body: JSON.stringify([...staticImages, ...uploadedImages])
                    };
                }
            } catch (e) {
                // No uploaded images yet
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(staticImages)
            };
        }

        // POST - Upload image (for now, just store metadata)
        // Note: For full image upload, Cloudinary integration is needed
        if (event.httpMethod === 'POST') {
            // Parse base64 image from request body
            const body = JSON.parse(event.body || '{}');

            if (!body.image || !body.filename) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Görsel ve dosya adı gerekli' })
                };
            }

            // Generate unique filename
            const uniqueName = `upload-${Date.now()}-${body.filename}`;

            // Store image as base64 in Blobs (for small images only)
            // For production, use Cloudinary
            await store.set(`image-${uniqueName}`, body.image);

            // Update uploaded images list
            let uploadedImages = [];
            try {
                const existing = await store.get('uploaded-images', { type: 'json' });
                if (existing && Array.isArray(existing)) {
                    uploadedImages = existing;
                }
            } catch (e) { }

            uploadedImages.push({
                name: uniqueName,
                path: `/.netlify/functions/images?file=${uniqueName}`,
                folder: 'uploads'
            });

            await store.setJSON('uploaded-images', uploadedImages);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Görsel başarıyla yüklendi!',
                    file: {
                        name: uniqueName,
                        path: `/.netlify/functions/images?file=${uniqueName}`
                    }
                })
            };
        }

        // DELETE - Remove image
        if (event.httpMethod === 'DELETE') {
            const path = event.path;
            const parts = path.split('/');
            const folder = parts[parts.length - 2];
            const filename = parts[parts.length - 1];

            if (folder === 'images') {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Statik görseller silinemez' })
                };
            }

            // Remove from Blobs
            try {
                await store.delete(`image-${filename}`);

                // Update uploaded images list
                let uploadedImages = [];
                try {
                    const existing = await store.get('uploaded-images', { type: 'json' });
                    if (existing && Array.isArray(existing)) {
                        uploadedImages = existing.filter(img => img.name !== filename);
                    }
                } catch (e) { }

                await store.setJSON('uploaded-images', uploadedImages);

                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ success: true, message: 'Görsel silindi!' })
                };
            } catch (error) {
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({ error: 'Görsel silinirken hata oluştu' })
                };
            }
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
            body: JSON.stringify({ error: 'Sunucu hatası' })
        };
    }
};
