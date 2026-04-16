const { Router } = require('express');
const { signup } = require('../controllers/authController/signup.controller');
const { login } = require('../controllers/authController/login.controller');
const { logout } = require('../controllers/authController/logout.controller');
const { deleteAccount } = require('../controllers/authController/deleteAccount.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', requireAuth, logout);
router.delete('/account', requireAuth, deleteAccount);

module.exports = router;
