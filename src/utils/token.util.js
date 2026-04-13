const jwt = require('jsonwebtoken');
const requireEnv = require('./requireEnv.util');

const jwtSecret = requireEnv('JWT_SECRET');

function signAccessToken(payload) {
    return jwt.sign(payload, jwtSecret);
}

module.exports = {
    signAccessToken,
};
