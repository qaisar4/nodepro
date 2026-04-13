const { Router } = require('express');
const authRoutes = require('./auth.routes');
const mediaRoutes = require('./media.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/media', mediaRoutes);

module.exports = router;
