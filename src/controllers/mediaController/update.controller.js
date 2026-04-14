const mediaService = require('../../services/media.service');
const {
    validateMediaId,
    validateUpdateMediaBody,
    validateOptionalUpdateFiles,
} = require('../../validators/media.validator');

function sendError(res, status, code, message) {
    return res.status(status).json({
        success: false,
        error: { code, message },
    });
}

async function update(req, res) {
    try {
        const idValidation = validateMediaId(req.params.id);
        if (!idValidation.valid) {
            return sendError(res, idValidation.status, idValidation.code, idValidation.message);
        }

        const bodyValidation = validateUpdateMediaBody(req.body);
        if (!bodyValidation.valid) {
            return sendError(res, bodyValidation.status, bodyValidation.code, bodyValidation.message);
        }

        const filesValidation = validateOptionalUpdateFiles(req.files);
        if (!filesValidation.valid) {
            return sendError(res, filesValidation.status, filesValidation.code, filesValidation.message);
        }

        const hasBodyUpdates = Object.keys(bodyValidation.data).length > 0;
        const hasFileUpdates = Boolean(filesValidation.data.imageFile || filesValidation.data.audioFile);
        if (!hasBodyUpdates && !hasFileUpdates) {
            return sendError(res, 400, 'VALIDATION_ERROR', 'At least one field or file is required to update');
        }

        const result = await mediaService.updateMedia({
            id: idValidation.data,
            ...bodyValidation.data,
            imageFile: filesValidation.data.imageFile,
            audioFile: filesValidation.data.audioFile,
        });

        if (!result.ok) {
            return sendError(res, result.status, result.code, result.message);
        }

        return res.status(200).json({
            success: true,
            data: {
                message: 'Media updated successfully',
                media: result.media,
            },
        });
    } catch (err) {
        console.error(err);
        if (process.env.NODE_ENV !== 'production' && err?.message) {
            return res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Something went wrong',
                    details: err.message,
                },
            });
        }
        return sendError(res, 500, 'INTERNAL_ERROR', 'Something went wrong');
    }
}

module.exports = { update };
