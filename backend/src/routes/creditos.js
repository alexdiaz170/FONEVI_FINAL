const router = require('express').Router();
const creditoController = require('../controllers/creditoController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', requireRole('administrador', 'tesorero'), creditoController.list);
router.get('/:id', creditoController.get);
router.post('/', requireRole('administrador', 'tesorero'), creditoController.create);
router.put('/:id', requireRole('administrador', 'tesorero'), creditoController.update);
router.delete('/:id', requireRole('administrador'), creditoController.delete);

module.exports = router;
