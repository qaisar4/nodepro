const { Router } = require('express');
const multer = require('multer');
const { upload: uploadHandler } = require('../controllers/mediaController/upload.controller');
const { list } = require('../controllers/mediaController/list.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
});

router.post('/upload', requireAuth, upload.single('file'), uploadHandler);
router.get('/', requireAuth, list);

module.exports = router;
