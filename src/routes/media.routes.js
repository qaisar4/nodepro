const { Router } = require('express');
const multer = require('multer');
const { upload: uploadHandler } = require('../controllers/mediaController/upload.controller');
const { update: updateHandler } = require('../controllers/mediaController/update.controller');
const { list, listAlbums, listSongs } = require('../controllers/mediaController/list.controller');
const { requireAuth, requireArtist } = require('../middlewares/auth.middleware');

const router = Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
});

function handleMediaUpload(req, res, next) {
    upload.fields([
        { name: 'coverImage', maxCount: 1 },
        { name: 'audioFile', maxCount: 1 },
    ])(req, res, (err) => {
        if (!err) {
            return next();
        }

        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'File size exceeds 10MB limit',
                    },
                });
            }

            if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Unexpected file field. Use "coverImage" and "audioFile" keys only',
                    },
                });
            }
        }

        return next(err);
    });
}

router.post('/', requireAuth, requireArtist, handleMediaUpload, uploadHandler);
router.put('/:mediaId', requireAuth, requireArtist, handleMediaUpload, updateHandler);
router.get('/albums', requireAuth, listAlbums);
router.get('/songs', requireAuth, listSongs);
router.get('/', requireAuth, list);

module.exports = router;
