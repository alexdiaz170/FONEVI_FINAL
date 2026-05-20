const router = require('express').Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

router.post('/login', authController.login);
router.get('/perfil', requireAuth, authController.getProfile);
router.put('/cambiar-password', requireAuth, authController.changePassword);

module.exports = router;
