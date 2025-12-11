const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'geometri-yapi-jwt-secret-2024';

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Get token from Authorization header
        const authHeader = event.headers.authorization || event.headers.Authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ authenticated: false })
            };
        }

        const token = authHeader.substring(7);

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                authenticated: true,
                username: decoded.username
            })
        };
    } catch (error) {
        // Token invalid or expired
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ authenticated: false })
        };
    }
};
