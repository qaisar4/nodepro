const { Router } = require('express');
const authRoutes = require('./auth.routes');
const mediaRoutes = require('./media.routes');
const userRoutes = require('./user.routes');
const {requireAuth} = require('../middlewares/auth.middleware');

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', requireAuth, userRoutes);
router.use('/media', mediaRoutes);

module.exports = router;
