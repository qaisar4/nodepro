const mongoose = require('mongoose');
const User = require('../models/user.model');
const { hashPassword, comparePassword } = require('../utils/password.util');
const { signAccessToken } = require('../utils/token.util');

function publicUserFields(user) {
    return {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
    };
}

function fail(status, code, message) {
    return { ok: false, status, code, message };
}

/**
 * registerUser — business logic for creating an account and issuing a token.
 * @returns {Promise<{ ok: true, user: object, accessToken: string } | { ok: false, status: number, code: string, message: string }>}
 */
async function registerUser({ username, email, password, role }) {
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
        if (existing.email === email) {
            return fail(409, 'EMAIL_TAKEN', 'Email is already registered');
        }
        return fail(409, 'USERNAME_TAKEN', 'Username is already taken');
    }

    const hashed = await hashPassword(password);
    let user;
    try {
        user = await User.create({
            username,
            email,
            password: hashed,
            ...(role ? { role } : {}),
        });
    } catch (err) {
        if (err instanceof mongoose.Error.MongoServerError && err.code === 11000) {
            const key = err.keyPattern ? Object.keys(err.keyPattern)[0] : 'field';
            return fail(409, 'DUPLICATE_KEY', `${key} is already registered`);
        }
        if (err instanceof mongoose.Error.ValidationError) {
            const first = Object.values(err.errors)[0];
            return fail(400, 'VALIDATION_ERROR', first?.message || 'Validation failed');
        }
        throw err;
    }

    const token = signAccessToken({
        sub: user._id.toString(),
        email: user.email,
        role: user.role,
    });

    return { ok: true, user: publicUserFields(user), accessToken: token };
}

/**
 * loginUser — verifies credentials and returns the same token shape as signup.
 * @returns {Promise<{ ok: true, user: object, accessToken: string } | { ok: false, status: number, code: string, message: string }>}
 */
async function loginUser({ email, password }) {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        return fail(401, 'INVALID_CREDENTIALS', 'User not found');
    }

    const ok = await comparePassword(password, user.password);
    if (!ok) {
        return fail(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const token = signAccessToken({
        sub: user._id.toString(),
        email: user.email,
        role: user.role,
    });

    return { ok: true, user: publicUserFields(user), accessToken: token };
}

/**
 * logoutUser — stateless logout; client should discard token.
 */
function logoutUser() {
    return { ok: true, message: 'User logged out successfully' };
}

/**
 * deleteUserAccount — removes current authenticated user.
 * @returns {Promise<{ ok: true, message: string } | { ok: false, status: number, code: string, message: string }>}
 */
async function deleteUserAccount({ userId }) {
    const deleted = await User.findByIdAndDelete(userId);
    if (!deleted) {
        return fail(404, 'USER_NOT_FOUND', 'User account not found');
    }
    return { ok: true, message: 'Account deleted successfully' };
}

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    deleteUserAccount,
};
