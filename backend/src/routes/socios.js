const router = require('express').Router();
const socioController = require('../controllers/socioController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);
router.get('/', requireRole('administrador', 'tesorero'), socioController.list);
// Perfil del socio autenticado (debe estar antes de rutas con ":id")
router.get('/perfil', socioController.perfil);
router.get('/:id', socioController.get);
router.get('/:id/estado-cuenta', socioController.estadoCuenta);
router.post('/', requireRole('administrador', 'tesorero'), socioController.create);
router.put('/:id', requireRole('administrador', 'tesorero'), socioController.update);
router.delete('/:id', requireRole('administrador'), socioController.delete);

module.exports = router;
