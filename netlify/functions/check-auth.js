const jwt = require('jsonwebtoken');
const { getCorsHeaders, checkRequiredEnvVars } = require('./utils/security');

const JWT_SECRET = process.env.JWT_SECRET;

exports.handler = async (event, context) => {
    const headers = getCorsHeaders(event, ['GET', 'OPTIONS']);

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

    // Check required environment variables
    const envCheck = checkRequiredEnvVars(['JWT_SECRET']);
    if (!envCheck.valid) {
        console.error('CRITICAL: Missing JWT_SECRET');
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ authenticated: false })
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
