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

function validateUploadedFiles(files) {
    const imageFile = files?.image?.[0];
    const audioFile = files?.audio?.[0];

    if (!imageFile) {
        return invalid(400, 'VALIDATION_ERROR', 'image file is required');
    }

    if (!audioFile) {
        return invalid(400, 'VALIDATION_ERROR', 'audio file is required');
    }

    const imageMimeType = String(imageFile.mimetype || '').toLowerCase();
    if (!imageMimeType.startsWith('image/')) {
        return invalid(400, 'VALIDATION_ERROR', 'Only image files are allowed for key "image"');
    }

    const audioMimeType = String(audioFile.mimetype || '').toLowerCase();
    if (!audioMimeType.startsWith('audio/')) {
        return invalid(400, 'VALIDATION_ERROR', 'Only audio files are allowed for key "audio"');
    }

    return {
        valid: true,
        data: {
            imageFile,
            audioFile,
        },
    };
}

module.exports = {
    validateUploadMediaBody,
    validateUploadedFiles,
};
