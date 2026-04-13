const { Router } = require('express');
const multer = require('multer');
const mediaController = require('../controllers/media.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
});

router.post('/upload', requireAuth, upload.single('file'), mediaController.upload);
router.get('/', requireAuth, mediaController.list);

module.exports = router;
