const mediaService = require('../../services/media.service');

function sendError(res, status, code, message) {
    return res.status(status).json({
        success: false,
        error: { code, message },
    });
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
                songs: result.songs,
                albums: result.albums,
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

async function listAlbums(req, res) {
    try {
        const result = await mediaService.listAlbums();
        if (!result.ok) {
            return sendError(res, result.status, result.code, result.message);
        }

        return res.status(200).json({
            success: true,
            data: {
                albums: result.albums,
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

async function listSongs(req, res) {
    try {
        const result = await mediaService.listSongs();
        if (!result.ok) {
            return sendError(res, result.status, result.code, result.message);
        }

        return res.status(200).json({
            success: true,
            data: {
                songs: result.songs,
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

module.exports = { list, listAlbums, listSongs };
