const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getCorsHeaders, rateLimit, getClientIp, checkRequiredEnvVars } = require('./utils/security');

// Required environment variables - NO FALLBACKS for security
const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Cache password hash to avoid computing on every request
let ADMIN_PASSWORD_HASH = null;

// Initialize password hash
function getPasswordHash() {
    if (!ADMIN_PASSWORD_HASH && ADMIN_PASSWORD) {
        ADMIN_PASSWORD_HASH = bcrypt.hashSync(ADMIN_PASSWORD, 12);
    }
    return ADMIN_PASSWORD_HASH;
}

exports.handler = async (event, context) => {
    const headers = getCorsHeaders(event, ['POST', 'OPTIONS']);

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    // Check required environment variables
    const envCheck = checkRequiredEnvVars(['JWT_SECRET', 'ADMIN_USERNAME', 'ADMIN_PASSWORD']);
    if (!envCheck.valid) {
        console.error('CRITICAL: Missing environment variables:', envCheck.missing);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Sunucu yapılandırma hatası' })
        };
    }

    // Rate limiting - 5 attempts per minute per IP
    const clientIp = getClientIp(event);
    const rateLimitResult = rateLimit(clientIp, 5, 60000);

    if (!rateLimitResult.allowed) {
        return {
            statusCode: 429,
            headers: {
                ...headers,
                'Retry-After': '60'
            },
            body: JSON.stringify({
                error: 'Çok fazla deneme. Lütfen 1 dakika bekleyin.',
                retryAfter: 60
            })
        };
    }

    try {
        const { username, password } = JSON.parse(event.body || '{}');

        if (!username || !password) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Kullanıcı adı ve şifre gerekli' })
            };
        }

        // Verify credentials
        const isValidUser = username === ADMIN_USERNAME;
        const passwordHash = getPasswordHash();
        const isValidPassword = passwordHash && bcrypt.compareSync(password, passwordHash);

        if (isValidUser && isValidPassword) {
            // Generate JWT token
            const token = jwt.sign(
                { username, role: 'admin' },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Giriş başarılı!',
                    token
                })
            };
        } else {
            // Don't reveal which credential was wrong
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Kullanıcı adı veya şifre hatalı!' })
            };
        }
    } catch (error) {
        console.error('Auth error:', error.message);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Sunucu hatası' })
        };
    }
};
