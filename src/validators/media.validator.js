function invalid(status, code, message) {
    return { valid: false, status, code, message };
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

function validateUploadedFile(file) {
    if (!file) {
        return invalid(400, 'VALIDATION_ERROR', 'file is required');
    }

    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
        return invalid(400, 'VALIDATION_ERROR', 'Only image files are allowed');
    }

    return { valid: true };
}

module.exports = {
    validateUploadMediaBody,
    validateUploadedFile,
};
