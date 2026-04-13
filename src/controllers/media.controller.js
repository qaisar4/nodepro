const mediaService = require('../services/media.service');
const { validateUploadMediaBody, validateUploadedFile } = require('../validators/media.validator');

function sendError(res, status, code, message) {
    return res.status(status).json({
        success: false,
        error: { code, message },
    });
}

async function upload(req, res) {
    try {
        const bodyValidation = validateUploadMediaBody(req.body);
        if (!bodyValidation.valid) {
            return sendError(res, bodyValidation.status, bodyValidation.code, bodyValidation.message);
        }

        const fileValidation = validateUploadedFile(req.file);
        if (!fileValidation.valid) {
            return sendError(res, fileValidation.status, fileValidation.code, fileValidation.message);
        }

        const result = await mediaService.uploadMedia({
            ...bodyValidation.data,
            file: req.file,
        });

        if (!result.ok) {
            return sendError(res, result.status, result.code, result.message);
        }

        return res.status(201).json({
            success: true,
            data: {
                message: 'File uploaded successfully',
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

async function list(req, res) {
    try {
        const result = await mediaService.listMedia();
        if (!result.ok) {
            return sendError(res, result.status, result.code, result.message);
        }

        return res.status(200).json({
            success: true,
            data: {
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

module.exports = {
    upload,
    list,
};
