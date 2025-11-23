const express = require('express');
const path = require('path');
// use built-in json parser
const { initDB, getDB } = require('./src/config/database');

const authController = require('./src/controllers/authController');
const adminController = require('./src/controllers/adminController');
const pedidoController = require('./src/controllers/pedidoController');
const userController = require('./src/controllers/userController');
const profilesController = require('./src/controllers/profilesController');
const ratingController = require('./src/controllers/ratingController');
const reclamoController = require('./src/controllers/reclamoController');
const backupController = require('./src/controllers/backupController');
const databaseController = require('./src/controllers/databaseController');
const mensajeController = require('./src/controllers/mensajeController');
const categoriaController = require('./src/controllers/categoriaController');
const notificationController = require('./src/controllers/notificationController');

const authMiddleware = require('./src/middleware/authMiddleware');
const adminMiddleware = require('./src/middleware/adminMiddleware');
const backupService = require('./src/services/backupService');

const app = express();
// Aumentar límite para permitir imágenes en base64 (hasta 10MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Static frontend
app.use('/frontend', express.static(path.join(__dirname, '..', 'frontend')));

// API routes
app.use('/api/auth', authController);
app.use('/api/categorias', categoriaController); // Ruta pública para categorías activas
app.use('/api/admin', authMiddleware, adminMiddleware, adminController);
app.use('/api/admin', authMiddleware, adminMiddleware, backupController);
app.use('/api/admin', authMiddleware, adminMiddleware, databaseController);
app.use('/api/admin', authMiddleware, adminMiddleware, categoriaController);
app.use('/api/pedidos', authMiddleware, pedidoController);
app.use('/api/users', userController);
app.use('/api/profiles', profilesController);
app.use('/api/profesionales', ratingController); // Ahora público, sin authMiddleware
app.use('/api/reclamos', authMiddleware, reclamoController);
app.use('/api/mensajes', authMiddleware, mensajeController);
// Notificaciones: /stream sin authMiddleware (maneja token internamente), resto con middleware
app.use('/api/notifications', notificationController);

const PORT = process.env.PORT || 3000;

initDB().then(()=>{
  // Programar backups automáticos cada 24 horas, manteniendo últimos 10
  backupService.scheduleBackups(24, 10);
  
  app.listen(PORT, '0.0.0.0', ()=>{
    console.log(`Server listening on port ${PORT}`);
    console.log(`Local: http://localhost:${PORT}`);
    console.log(`Network: http://[TU-IP-LOCAL]:${PORT}`);
  });
}).catch(err=>{
  console.error('DB init failed', err);
});
