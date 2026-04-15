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
    const fallback = `media-${Date.now()}.bin`;
    if (typeof originalName !== 'string' || originalName.trim() === '') {
        return fallback;
    }
    return originalName.trim().replace(/\s+/g, '-');
}

async function uploadSingleFile(file) {
    const fileName = buildSafeFileName(file.originalname);
    try {
        const fileForUpload = await toFile(
            file.buffer,
            fileName,
            file.mimetype ? { type: file.mimetype } : undefined,
        );
        const uploadResult = await imagekit.files.upload({
            file: fileForUpload,
            fileName,
            folder: '/nodepro',
            useUniqueFileName: true,
        });
        return { ok: true, fileName, uploadResult };
    } catch (err) {
        return mapImageKitUploadError(err);
    }
}

function mapMedia(doc) {
    return {
        id: doc._id.toString(),
        title: doc.title,
        description: doc.description,
        name: doc.name,
        audioFileName: doc.name,
        url: doc.url,
        audioUrl: doc.url,
        thumbnail: doc.thumbnail,
        coverImageUrl: doc.thumbnail,
        artistId: doc.artistId?._id ? doc.artistId._id.toString() : doc.artistId?.toString?.() || null,
        artistUsername: doc.artistId?.username || null,
        isInAlbum: Boolean(doc.isInAlbum),
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    };
}

async function uploadMedia({ title, description, artistId, isInAlbum, imageFile, audioFile }) {
    const imageUpload = await uploadSingleFile(imageFile);
    if (!imageUpload.ok) {
        return imageUpload;
    }

    const audioUpload = await uploadSingleFile(audioFile);
    if (!audioUpload.ok) {
        return audioUpload;
    }

    let mediaDoc;
    try {
        mediaDoc = await Media.create({
            title,
            description,
            name: audioUpload.uploadResult.name || audioUpload.fileName,
            url: audioUpload.uploadResult.url,
            thumbnail: imageUpload.uploadResult.url,
            artistId,
            isInAlbum: Boolean(isInAlbum),
            imageKitFileId: audioUpload.uploadResult.fileId,
            imageKitThumbnailFileId: imageUpload.uploadResult.fileId,
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
        media: mapMedia(mediaDoc),
    };
}

async function updateMedia({ id, title, description, imageFile, audioFile }) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return fail(400, 'VALIDATION_ERROR', 'Invalid media id');
    }

    const mediaDoc = await Media.findById(id);
    if (!mediaDoc) {
        return fail(404, 'NOT_FOUND', 'Media not found');
    }

    let imageUpload = null;
    if (imageFile) {
        imageUpload = await uploadSingleFile(imageFile);
        if (!imageUpload.ok) {
            return imageUpload;
        }
    }

    let audioUpload = null;
    if (audioFile) {
        audioUpload = await uploadSingleFile(audioFile);
        if (!audioUpload.ok) {
            return audioUpload;
        }
    }

    if (typeof title === 'string') {
        mediaDoc.title = title;
    }
    if (typeof description === 'string') {
        mediaDoc.description = description;
    }
    if (imageUpload) {
        mediaDoc.thumbnail = imageUpload.uploadResult.url;
        mediaDoc.imageKitThumbnailFileId = imageUpload.uploadResult.fileId;
    }
    if (audioUpload) {
        mediaDoc.name = audioUpload.uploadResult.name || audioUpload.fileName;
        mediaDoc.url = audioUpload.uploadResult.url;
        mediaDoc.imageKitFileId = audioUpload.uploadResult.fileId;
    }

    try {
        await mediaDoc.save();
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
        media: mapMedia(mediaDoc),
    };
}

async function listMedia() {
    const mediaDocs = await Media.find().populate('artistId', 'username').sort({ createdAt: -1 });
    const songs = [];
    const albumsByArtist = new Map();

    mediaDocs.forEach((doc) => {
        const media = mapMedia(doc);
        if (!media.isInAlbum) {
            songs.push(media);
            return;
        }

        const key = media.artistId || 'unknown';
        if (!albumsByArtist.has(key)) {
            albumsByArtist.set(key, {
                artistId: media.artistId,
                artistUsername: media.artistUsername,
                songs: [],
            });
        }
        albumsByArtist.get(key).songs.push(media);
    });

    const albums = Array.from(albumsByArtist.values());

    return {
        ok: true,
        media: mediaDocs.map(mapMedia),
        songs,
        albums,
    };
}

async function listAlbums() {
    const mediaDocs = await Media.find({ isInAlbum: true }).populate('artistId', 'username').sort({ createdAt: -1 });
    const albumsByArtist = new Map();

    mediaDocs.forEach((doc) => {
        const media = mapMedia(doc);
        const key = media.artistId || 'unknown';
        if (!albumsByArtist.has(key)) {
            albumsByArtist.set(key, {
                artistId: media.artistId,
                artistUsername: media.artistUsername,
                songs: [],
            });
        }
        albumsByArtist.get(key).songs.push(media);
    });

    return {
        ok: true,
        albums: Array.from(albumsByArtist.values()),
    };
}

async function listSongs() {
    const mediaDocs = await Media.find({ isInAlbum: false }).populate('artistId', 'username').sort({ createdAt: -1 });
    return {
        ok: true,
        songs: mediaDocs.map(mapMedia),
    };
}

module.exports = {
    uploadMedia,
    updateMedia,
    listMedia,
    listAlbums,
    listSongs,
};
