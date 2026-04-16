const { Router } = require('express');
const { profile } = require('../controllers/authController/profile.controller');

const router = Router();

router.get('/profile' , profile);

module.exports = router;
