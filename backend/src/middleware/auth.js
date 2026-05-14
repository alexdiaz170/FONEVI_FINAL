// ─────────────────────────────────────────────────────────────
// FONEVI — Middleware: Autenticación JWT real
// ─────────────────────────────────────────────────────────────
const jwt = require('jsonwebtoken');

/**
 * Verifica que el request tenga un JWT válido en el header
 * Authorization: Bearer <token>
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ ok: false, mensaje: 'Token faltante' });
  }

  try {
    const payload  = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario    = payload;   // { id, nombre, email, rol }
    next();
  } catch (err) {
    console.error('[Auth] Error de verificación:', err.message);
    const msg = err.name === 'TokenExpiredError'
      ? 'Sesión expirada'
      : 'Token inválido o corrupto';
    return res.status(401).json({ ok: false, mensaje: msg });
  }
}

/**
 * Middleware para restringir rutas por rol
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ ok: false, mensaje: 'Usuario no identificado' });
    }
    
    // Búsqueda insensible a mayúsculas
    const rolUsuario = (req.usuario.rol || '').toLowerCase();
    const rolesPermitidos = roles.map(r => r.toLowerCase());

    if (!rolesPermitidos.includes(rolUsuario)) {
      console.warn(`[Auth] Acceso denegado: Usuario ${req.usuario.email} (rol: ${rolUsuario}) intentó acceder a ruta para ${roles.join(',')}`);
      return res.status(403).json({ ok: false, mensaje: 'No tienes permisos suficientes' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
