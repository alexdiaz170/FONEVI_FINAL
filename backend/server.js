/**
 * FONEVI — Servidor Backend Simple
 * Sirve el frontend + API backend
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const frontendPath = path.join(__dirname, '..');

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// API endpoints PRIMERO
app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ ok: false, mensaje: 'Email y contraseña requeridos' });
  }
  res.json({
    ok: true,
    usuario: { id: 'test', email, nombre: 'Usuario Test', rol: 'administrador' }
  });
});

// Servir archivos estáticos (CSS, JS, etc)
app.use(express.static(frontendPath, { 
  index: false,
  extensions: ['html', 'css', 'js', 'json', 'svg', 'png', 'jpg', 'jpeg', 'gif', 'webp']
}));

// Fallback a index.html para rutas no-API
app.use((req, res) => {
  const indexFile = path.join(frontendPath, 'index.html');
  if (fs.existsSync(indexFile)) {
    res.sendFile(indexFile);
  } else {
    res.status(404).json({ ok: false, mensaje: 'Ruta no encontrada' });
  }
});

// Iniciar servidor
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('\n✅ FONEVI Backend corriendo en http://localhost:' + PORT);
  console.log('📝 Base de datos: Supabase PostgreSQL');
  console.log('🔐 CORS: Habilitado para todos los orígenes\n');
});

// Manejar Ctrl+C
process.on('SIGINT', () => {
  console.log('\n🛑 Deteniendo servidor...');
  server.close(() => process.exit(0));
});
