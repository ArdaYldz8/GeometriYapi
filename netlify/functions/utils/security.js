// ============================================
// SECURITY UTILITIES - Geometri YAPI
// Shared security functions for all Netlify Functions
// ============================================

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
    'https://geometriyapi.netlify.app',
    'http://localhost:3000',
    'http://localhost:8888' // Netlify CLI dev server
];

/**
 * Get CORS headers based on request origin
 * @param {Object} event - Netlify function event
 * @param {Array} methods - Allowed HTTP methods
 * @returns {Object} Headers object
 */
function getCorsHeaders(event, methods = ['GET', 'OPTIONS']) {
    const origin = event.headers.origin || event.headers.Origin || '';
    const allowedOrigin = ALLOWED_ORIGINS.includes(origin)
        ? origin
        : ALLOWED_ORIGINS[0];

    return {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': methods.join(', '),
        'Content-Type': 'application/json'
    };
}

// In-memory rate limit store
const rateLimitStore = new Map();

/**
 * Simple rate limiter for Netlify Functions
 * @param {string} ip - Client IP address
 * @param {number} limit - Max requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Object} { allowed: boolean, remaining: number }
 */
function rateLimit(ip, limit = 10, windowMs = 60000) {
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!rateLimitStore.has(ip)) {
        rateLimitStore.set(ip, []);
    }

    // Filter out old requests
    const requests = rateLimitStore.get(ip).filter(time => time > windowStart);
    requests.push(now);
    rateLimitStore.set(ip, requests);

    // Cleanup old entries periodically
    if (rateLimitStore.size > 1000) {
        for (const [key, value] of rateLimitStore.entries()) {
            const filtered = value.filter(time => time > windowStart);
            if (filtered.length === 0) {
                rateLimitStore.delete(key);
            } else {
                rateLimitStore.set(key, filtered);
            }
        }
    }

    return {
        allowed: requests.length <= limit,
        remaining: Math.max(0, limit - requests.length)
    };
}

/**
 * Get client IP from Netlify event
 * @param {Object} event - Netlify function event
 * @returns {string} Client IP address
 */
function getClientIp(event) {
    return event.headers['x-forwarded-for']?.split(',')[0]?.trim()
        || event.headers['client-ip']
        || 'unknown';
}

/**
 * Check if environment is properly configured
 * @param {Array} requiredVars - List of required environment variable names
 * @returns {Object} { valid: boolean, missing: Array }
 */
function checkRequiredEnvVars(requiredVars) {
    const missing = requiredVars.filter(varName => !process.env[varName]);
    return {
        valid: missing.length === 0,
        missing
    };
}

module.exports = {
    ALLOWED_ORIGINS,
    getCorsHeaders,
    rateLimit,
    getClientIp,
    checkRequiredEnvVars
};
