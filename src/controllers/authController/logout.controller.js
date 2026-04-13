const authService = require('../../services/auth.service');

function sendError(res, status, code, message) {
    return res.status(status).json({
        success: false,
        error: { code, message },
    });
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

module.exports = { logout };
