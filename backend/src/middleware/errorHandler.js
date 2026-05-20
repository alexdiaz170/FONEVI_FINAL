module.exports = (err, req, res, next) => {
  console.error(`[Error ${new Date().toISOString()}] ${req.method} ${req.url}:`, err);

  const status = err.status || 500;
  const message = err.message || 'Error interno del servidor';
  
  res.status(status).json({
    ok: false,
    mensaje: message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};
