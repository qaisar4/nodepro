const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function invalid(status, code, message) {
    return { valid: false, status, code, message };
}

/**
 * Validates signup payload.
 * @returns {{ valid: true, data: object } | { valid: false, status: number, code: string, message: string }}
 */
function validateSignupBody(body) {
    if (typeof body.username !== 'string' || body.username.trim() === '') {
        return invalid(400, 'VALIDATION_ERROR', 'username is required');
    }
    const username = body.username.trim();
    if (username.length < 2 || username.length > 50) {
        return invalid(400, 'VALIDATION_ERROR', 'username must be between 2 and 50 characters');
    }

    if (typeof body.email !== 'string' || body.email.trim() === '') {
        return invalid(400, 'VALIDATION_ERROR', 'email is required');
    }
    const email = body.email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
        return invalid(400, 'VALIDATION_ERROR', 'email must be valid');
    }

    if (typeof body.password !== 'string' || body.password.trim() === '') {
        return invalid(400, 'VALIDATION_ERROR', 'password is required');
    }
    const password = body.password.trim();
    if (password.length < 8) {
        return invalid(400, 'VALIDATION_ERROR', 'password must be at least 8 characters');
    }

    let role = body.role;
    if (role !== undefined) {
        if (typeof role !== 'string' || !['user', 'artist'].includes(role)) {
            return invalid(400, 'VALIDATION_ERROR', 'role must be "user" or "artist"');
        }
    }

    return { valid: true, data: { username, email, password, role } };
}

/**
 * Validates login payload.
 * @returns {{ valid: true, data: object } | { valid: false, status: number, code: string, message: string }}
 */
function validateLoginBody(body) {
    if (typeof body.email !== 'string' || body.email.trim() === '') {
        return invalid(400, 'VALIDATION_ERROR', 'email is required');
    }
    const email = body.email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
        return invalid(400, 'VALIDATION_ERROR', 'email must be valid');
    }
    if (typeof body.password !== 'string' || body.password.trim() === '') {
        return invalid(400, 'VALIDATION_ERROR', 'password is required');
    }
    const password = body.password.trim();
    return { valid: true, data: { email, password } };
}

/**
 * Validates authenticated request context for delete account.
 * @returns {{ valid: true, data: object } | { valid: false, status: number, code: string, message: string }}
 */
function validateDeleteAccountContext(req) {
    const userId = req?.user?.id;
    if (typeof userId !== 'string' || userId.trim() === '') {
        return invalid(401, 'UNAUTHORIZED', 'User authentication is required');
    }
    return { valid: true, data: { userId } };
}

module.exports = {
    validateSignupBody,
    validateLoginBody,
    validateDeleteAccountContext,
};
