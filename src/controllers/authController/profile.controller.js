const authService = require('../../services/auth.service');
const { validateProfileContext } = require('../../validators/auth.validator');

function sendError(res, status, code, message) {
    return res.status(status).json({
        success: false,
        error: { code, message },
    });
}

async function profile(req, res) {
    try {
        const v = validateProfileContext(req);
        if (!v.valid) {
            return sendError(res, v.status, v.code, v.message);
        }

        const result = await authService.getUserProfile(v.data);
        if (!result.ok) {
            return sendError(res, result.status, result.code, result.message);
        }

        return res.status(200).json({
            success: true,
            data: { user: result.user },
        });
    } catch (err) {
        console.error(err);
        return sendError(res, 500, 'INTERNAL_ERROR', 'Something went wrong');
    }
}

module.exports = { profile };
