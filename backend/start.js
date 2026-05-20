const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const publicDir = path.join(__dirname, '..');
const indexPath = path.join(publicDir, 'index.html');

// CORS para todos
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());

// Log de rutas
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// API routes - primero
app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString(), db: 'connected', database: 'connected' });
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

// Servir archivos estáticos
app.use(express.static(publicDir));

// Fallback: cualquier ruta no-API sirve index.html
app.use((req, res) => {
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: 'index.html not found' });
  }
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Servidor en http://localhost:${PORT}\n`);
  console.log(`📝 Conectando a: http://127.0.0.1:${PORT}`);
  console.log('🔐 CORS: Habilitado para todos los orígenes\n');
});
