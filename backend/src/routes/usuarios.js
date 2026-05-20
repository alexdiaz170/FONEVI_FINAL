const router = require('express').Router();
const userController = require('../controllers/userController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);
router.use(requireRole('administrador'));

router.get('/', userController.list);
router.get('/:id', userController.get);
router.post('/', userController.create);
router.put('/:id', userController.update);
router.delete('/:id', userController.delete);

module.exports = router;
