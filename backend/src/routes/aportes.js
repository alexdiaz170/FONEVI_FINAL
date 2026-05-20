const router = require('express').Router();
const aporteController = require('../controllers/aporteController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', requireRole('administrador', 'tesorero'), aporteController.list);
router.get('/:id', aporteController.get);
router.post('/', requireRole('administrador', 'tesorero'), aporteController.create);
router.put('/:id/estado', requireRole('administrador', 'tesorero'), aporteController.update);
router.put('/:id', requireRole('administrador', 'tesorero'), aporteController.update);
router.delete('/:id', requireRole('administrador'), aporteController.delete);

module.exports = router;
