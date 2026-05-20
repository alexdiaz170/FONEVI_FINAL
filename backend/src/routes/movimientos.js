const router = require('express').Router();
const movimientoController = require('../controllers/movimientoController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', requireRole('administrador', 'tesorero'), movimientoController.list);
router.get('/:id', movimientoController.get);
router.post('/', requireRole('administrador', 'tesorero'), movimientoController.create);
router.put('/:id', requireRole('administrador', 'tesorero'), movimientoController.update);
router.delete('/:id', requireRole('administrador'), movimientoController.delete);

module.exports = router;
