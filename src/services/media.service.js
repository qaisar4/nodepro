const mongoose = require('mongoose');
const {
    toFile,
    APIError,
    APIConnectionError,
    APIConnectionTimeoutError,
    ImageKitError,
} = require('@imagekit/nodejs');
const imagekit = require('../config/imagekit.config');
const Media = require('../models/media.model');

function fail(status, code, message) {
    return { ok: false, status, code, message };
}

function mapImageKitUploadError(err) {
    if (err instanceof APIConnectionTimeoutError) {
        return fail(504, 'STORAGE_TIMEOUT', 'Media storage request timed out');
    }
    if (err instanceof APIConnectionError) {
        return fail(503, 'STORAGE_UNAVAILABLE', 'Could not connect to media storage');
    }
    if (err instanceof APIError && typeof err.status === 'number') {
        const detail = String(err.message || '').replace(/^\d{3}\s+/, '').trim();
        const message = detail || 'Upload failed';
        if (err.status >= 500) {
            return fail(502, 'STORAGE_ERROR', 'Media storage returned an error');
        }
        if (err.status === 401 || err.status === 403) {
            return fail(502, 'STORAGE_AUTH_ERROR', 'Media storage refused the request; check server configuration');
        }
        if (err.status === 429) {
            return fail(429, 'STORAGE_RATE_LIMIT', 'Upload rate limit exceeded; try again later');
        }
        if (err.status >= 400 && err.status < 500) {
            return fail(err.status, 'UPLOAD_FAILED', message);
        }
        return fail(502, 'STORAGE_ERROR', 'Media storage returned an error');
    }
    if (err instanceof ImageKitError) {
        return fail(400, 'UPLOAD_FAILED', err.message);
    }
    throw err;
}

function buildSafeFileName(originalName) {
    const fallback = `image-${Date.now()}.jpg`;
    if (typeof originalName !== 'string' || originalName.trim() === '') {
        return fallback;
    }
    return originalName.trim().replace(/\s+/g, '-');
}

async function uploadMedia({ title, description, file }) {
    const fileName = buildSafeFileName(file.originalname);

    let uploadResult;
    try {
        const fileForUpload = await toFile(
            file.buffer,
            fileName,
            file.mimetype ? { type: file.mimetype } : undefined,
        );
        uploadResult = await imagekit.files.upload({
            file: fileForUpload,
            fileName,
            folder: '/nodepro',
            useUniqueFileName: true,
        });
    } catch (err) {
        return mapImageKitUploadError(err);
    }

    let mediaDoc;
    try {
        mediaDoc = await Media.create({
            title,
            description,
            name: uploadResult.name || fileName,
            url: uploadResult.url,
            thumbnail: uploadResult.thumbnailUrl || uploadResult.url,
            imageKitFileId: uploadResult.fileId,
        });
    } catch (err) {
        if (err instanceof mongoose.Error.ValidationError) {
            const first = Object.values(err.errors)[0];
            return fail(400, 'VALIDATION_ERROR', first?.message || 'Validation failed');
        }
        if (err instanceof mongoose.Error.MongoServerError && err.code === 11000) {
            return fail(409, 'DUPLICATE_MEDIA', 'Media already exists');
        }
        throw err;
    }

    return {
        ok: true,
        media: {
            id: mediaDoc._id.toString(),
            title: mediaDoc.title,
            description: mediaDoc.description,
            name: mediaDoc.name,
            url: mediaDoc.url,
            thumbnail: mediaDoc.thumbnail,
            createdAt: mediaDoc.createdAt,
        },
    };
}

async function listMedia() {
    const mediaDocs = await Media.find().sort({ createdAt: -1 });
    return {
        ok: true,
        media: mediaDocs.map((doc) => ({
            id: doc._id.toString(),
            title: doc.title,
            description: doc.description,
            name: doc.name,
            url: doc.url,
            thumbnail: doc.thumbnail,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        })),
    };
}

module.exports = {
    uploadMedia,
    listMedia,
};
