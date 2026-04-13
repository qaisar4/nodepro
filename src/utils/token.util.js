const jwt = require('jsonwebtoken');
const requireEnv = require('./requireEnv.util');

const jwtSecret = requireEnv('JWT_SECRET');

function signAccessToken(payload) {
    return jwt.sign(payload, jwtSecret);
}

function verifyAccessToken(token) {
    return jwt.verify(token, jwtSecret);
}

module.exports = {
    signAccessToken,
    verifyAccessToken,
};
