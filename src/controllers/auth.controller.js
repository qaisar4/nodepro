const authService = require('../services/auth.service');
const { validateSignupBody, validateLoginBody, validateDeleteAccountContext } = require('../validators/auth.validator');

function sendError(res, status, code, message) {
    return res.status(status).json({
        success: false,
        error: { code, message },
    });
}

/**
 * signup — validate input, call service, send JSON.
 */
async function signup(req, res) {
    try {
        const v = validateSignupBody(req.body);
        if (!v.valid) {
            return sendError(res, v.status, v.code, v.message);
        }

        const result = await authService.registerUser(v.data);
        if (!result.ok) {
            return sendError(res, result.status, result.code, result.message);
        }

        return res.status(201).json({
            success: true,
            data: { user: result.user, accessToken: result.accessToken, message: "User registered successfully"},
        });
    } catch (err) {
        console.error(err);
        return sendError(res, 500, 'INTERNAL_ERROR', 'Something went wrong');
    }
}

/**
 * login — validate credentials payload, call service, send JSON.
 */
async function login(req, res) {
    try {
        const v = validateLoginBody(req.body);
        if (!v.valid) {
            return sendError(res, v.status, v.code, v.message);
        }

        const result = await authService.loginUser(v.data);
        if (!result.ok) {
            return sendError(res, result.status, result.code, result.message);
        }

        return res.status(200).json({
            success: true,
            data: { user: result.user, accessToken: result.accessToken, message: "User loged in successfully"},
        });
    } catch (err) {
        console.error(err);
        return sendError(res, 500, 'INTERNAL_ERROR', 'Something went wrong');
    }
}

/**
 * logout — stateless endpoint to let clients clear auth state.
 */
async function logout(req, res) {
    try {
        const result = authService.logoutUser();
        return res.status(200).json({
            success: true,
            data: { message: result.message },
        });
    } catch (err) {
        console.error(err);
        return sendError(res, 500, 'INTERNAL_ERROR', 'Something went wrong');
    }
}

/**
 * deleteAccount — removes currently authenticated user.
 */
async function deleteAccount(req, res) {
    try {
        const v = validateDeleteAccountContext(req);
        if (!v.valid) {
            return sendError(res, v.status, v.code, v.message);
        }

        const result = await authService.deleteUserAccount(v.data);
        if (!result.ok) {
            return sendError(res, result.status, result.code, result.message);
        }

        return res.status(200).json({
            success: true,
            data: { message: result.message },
        });
    } catch (err) {
        console.error(err);
        return sendError(res, 500, 'INTERNAL_ERROR', 'Something went wrong');
    }
}

module.exports = {
    signup,
    login,
    logout,
    deleteAccount,
};
