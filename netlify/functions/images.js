const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const { getCorsHeaders, checkRequiredEnvVars } = require('./utils/security');

const JWT_SECRET = process.env.JWT_SECRET;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Check if Cloudinary is configured
function isCloudinaryConfigured() {
    return process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET;
}

// Verify JWT token
function verifyToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    if (!JWT_SECRET) {
        console.error('CRITICAL: JWT_SECRET not configured');
        return null;
    }
    try {
        const token = authHeader.substring(7);
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

// Static fallback images
const staticImages = [
    { name: 'hero1.jpg', url: '/images/hero1.jpg', folder: 'local' },
    { name: 'project1.jpg', url: '/images/project1.jpg', folder: 'local' },
    { name: 'project2.jpg', url: '/images/project2.jpg', folder: 'local' },
    { name: 'project3.jpg', url: '/images/project3.jpg', folder: 'local' },
    { name: 'project4.jpg', url: '/images/project4.jpg', folder: 'local' },
    { name: 'project5.jpg', url: '/images/project5.jpg', folder: 'local' },
    { name: 'project6.jpg', url: '/images/project6.jpg', folder: 'local' }
];

exports.handler = async (event, context) => {
    const headers = getCorsHeaders(event, ['GET', 'POST', 'DELETE', 'OPTIONS']);

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        // GET - List all images
        if (event.httpMethod === 'GET') {
            // If Cloudinary is not configured, return static images
            if (!isCloudinaryConfigured()) {
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify(staticImages)
                };
            }

            // List images from Cloudinary
            try {
                const result = await cloudinary.api.resources({
                    type: 'upload',
                    prefix: 'geometri-yapi/',
                    max_results: 100
                });

                const cloudinaryImages = result.resources.map(img => ({
                    name: img.public_id.split('/').pop(),
                    url: img.secure_url,
                    publicId: img.public_id,
                    folder: 'cloudinary',
                    width: img.width,
                    height: img.height
                }));

                // Combine with static images
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify([...staticImages, ...cloudinaryImages])
                };
            } catch (cloudErr) {
                console.error('Cloudinary list error:', cloudErr.message);
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify(staticImages)
                };
            }
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

        // POST - Upload image to Cloudinary
        if (event.httpMethod === 'POST') {
            if (!isCloudinaryConfigured()) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        error: 'Cloudinary yapılandırılmamış. Lütfen env vars ekleyin.'
                    })
                };
            }

            try {
                // Parse the base64 image from request body
                const body = JSON.parse(event.body || '{}');

                if (!body.image) {
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({ error: 'Görsel verisi gerekli' })
                    };
                }

                // Upload to Cloudinary
                const uploadResult = await cloudinary.uploader.upload(body.image, {
                    folder: 'geometri-yapi',
                    resource_type: 'image',
                    transformation: [
                        { quality: 'auto' },
                        { fetch_format: 'auto' }
                    ]
                });

                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        message: 'Görsel başarıyla yüklendi!',
                        image: {
                            name: uploadResult.public_id.split('/').pop(),
                            url: uploadResult.secure_url,
                            publicId: uploadResult.public_id,
                            folder: 'cloudinary',
                            width: uploadResult.width,
                            height: uploadResult.height
                        }
                    })
                };
            } catch (uploadErr) {
                console.error('Upload error:', uploadErr.message);
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({ error: 'Görsel yüklenirken hata oluştu: ' + uploadErr.message })
                };
            }
        }

        // DELETE - Remove image from Cloudinary
        if (event.httpMethod === 'DELETE') {
            if (!isCloudinaryConfigured()) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Cloudinary yapılandırılmamış' })
                };
            }

            try {
                const body = JSON.parse(event.body || '{}');

                if (!body.publicId) {
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({ error: 'Görsel ID gerekli' })
                    };
                }

                // Only allow deleting Cloudinary images (not static)
                if (!body.publicId.startsWith('geometri-yapi/')) {
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({ error: 'Statik görseller silinemez' })
                    };
                }

                await cloudinary.uploader.destroy(body.publicId);

                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        message: 'Görsel silindi'
                    })
                };
            } catch (deleteErr) {
                console.error('Delete error:', deleteErr.message);
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
        console.error('Images error:', error.message);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Bir hata oluştu. Lütfen tekrar deneyin.' })
        };
    }
};
