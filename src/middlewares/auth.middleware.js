const { verifyAccessToken } = require('../utils/token.util');

function sendAuthError(res, message) {
    return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message },
    });
}

function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return sendAuthError(res, 'Authorization token is required');
    }

    const token = header.slice(7).trim();
    if (!token) {
        return sendAuthError(res, 'Authorization token is required');
    }

    try {
        const payload = verifyAccessToken(token);
        req.user = {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
        };
        return next();
    } catch (err) {
        return sendAuthError(res, 'Invalid or expired token');
    }
}

module.exports = {
    requireAuth,
};
