const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'geometri-yapi-jwt-secret-2024';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'geometri2024', 10);

exports.handler = async (event, context) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

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
        const isValidPassword = bcrypt.compareSync(password, ADMIN_PASSWORD_HASH);

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
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Kullanıcı adı veya şifre hatalı!' })
            };
        }
    } catch (error) {
        console.error('Auth error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Sunucu hatası' })
        };
    }
};
