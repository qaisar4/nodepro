function invalid(status, code, message) {
    return { valid: false, status, code, message };
}

function validateMediaId(id) {
    if (typeof id !== 'string' || id.trim() === '') {
        return invalid(400, 'VALIDATION_ERROR', 'media id is required');
    }
    return { valid: true, data: id.trim() };
}

function validateUploadMediaBody(body) {
    if (typeof body.title !== 'string' || body.title.trim() === '') {
        return invalid(400, 'VALIDATION_ERROR', 'title is required');
    }

    if (typeof body.description !== 'string' || body.description.trim() === '') {
        return invalid(400, 'VALIDATION_ERROR', 'description is required');
    }

    const title = body.title.trim();
    const description = body.description.trim();

    return { valid: true, data: { title, description } };
}

function validateUploadedFiles(files) {
    const imageFile = files?.coverImage?.[0];
    const audioFile = files?.audioFile?.[0];

    if (!imageFile) {
        return invalid(400, 'VALIDATION_ERROR', 'image file is required');
    }

    if (!audioFile) {
        return invalid(400, 'VALIDATION_ERROR', 'audio file is required');
    }

    const imageMimeType = String(imageFile.mimetype || '').toLowerCase();
    if (!imageMimeType.startsWith('image/')) {
        return invalid(400, 'VALIDATION_ERROR', 'Only image files are allowed for key "coverImage"');
    }

    const audioMimeType = String(audioFile.mimetype || '').toLowerCase();
    if (!audioMimeType.startsWith('audio/')) {
        return invalid(400, 'VALIDATION_ERROR', 'Only audio files are allowed for key "audioFile"');
    }

    return {
        valid: true,
        data: {
            imageFile,
            audioFile,
        },
    };
}

function validateUpdateMediaBody(body) {
    const data = {};

    if (Object.prototype.hasOwnProperty.call(body, 'title')) {
        if (typeof body.title !== 'string' || body.title.trim() === '') {
            return invalid(400, 'VALIDATION_ERROR', 'title must be a non-empty string');
        }
        data.title = body.title.trim();
    }

    if (Object.prototype.hasOwnProperty.call(body, 'description')) {
        if (typeof body.description !== 'string' || body.description.trim() === '') {
            return invalid(400, 'VALIDATION_ERROR', 'description must be a non-empty string');
        }
        data.description = body.description.trim();
    }

    return { valid: true, data };
}

function validateOptionalUpdateFiles(files) {
    const imageFile = files?.coverImage?.[0];
    const audioFile = files?.audioFile?.[0];

    if (imageFile) {
        const imageMimeType = String(imageFile.mimetype || '').toLowerCase();
        if (!imageMimeType.startsWith('image/')) {
            return invalid(400, 'VALIDATION_ERROR', 'Only image files are allowed for key "coverImage"');
        }
    }

    if (audioFile) {
        const audioMimeType = String(audioFile.mimetype || '').toLowerCase();
        if (!audioMimeType.startsWith('audio/')) {
            return invalid(400, 'VALIDATION_ERROR', 'Only audio files are allowed for key "audioFile"');
        }
    }

    return {
        valid: true,
        data: {
            imageFile: imageFile || null,
            audioFile: audioFile || null,
        },
    };
}

module.exports = {
    validateMediaId,
    validateUploadMediaBody,
    validateUploadedFiles,
    validateUpdateMediaBody,
    validateOptionalUpdateFiles,
};
