require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const perfilRoutes = require('./routes/perfil');
const sessionsRoutes = require('./routes/sessions');
const alumnosRoutes = require('./routes/alumnos');
const tutoresRoutes = require('./routes/tutores');
const adminRoutes = require('./routes/admin');
const app = express();




// Orígenes permitidos
const allowedOrigins = [
  'http://127.0.0.1:8081',
  'http://localhost:3000'
];


app.use('/api/sessions', sessionsRoutes);

// Middleware CORS personalizado
const corsOptions = {
  origin: function(origin, callback) {

    if (!origin) {
      return callback(null, true); // permitir sin origin (Postman, curl)
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin no permitido por CORS'), false);
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'] // 👈 AGREGA Cache-Control
};



// Log de origins que llegan
app.use((req, res, next) => {
  const origin = req.get('Origin');
  if (origin) console.log('[CORS] Origin recibido:', origin);
  next();
});

app.use(cors(corsOptions));

// Asegurar que respondemos correctamente a preflight OPTIONS
app.options('*', cors(corsOptions));

// Middleware para body JSON
app.use(express.json());

// Desactiva ETag para evitar 304 y cache del navegador
app.set('etag', false);

// Desactiva cache para todas las rutas de API
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// ✅ Rutas principales
app.use('/api/auth', authRoutes);
app.use('/api/perfil', perfilRoutes);
app.use('/api/alumnos', alumnosRoutes);
app.use('/api/tutores', tutoresRoutes);
app.use('/api/admin', adminRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Servidor funcionando 🚀');
});

// Manejo básico de errores
app.use((err, req, res, next) => {
  console.error('[ERROR]', err && err.message ? err.message : err);
  res.status(err.status || 500).json({ ok: false, message: err.message || 'Error del servidor' });
});

// Puerto
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});


