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

const authMiddleware = require('./src/middleware/authMiddleware');
const adminMiddleware = require('./src/middleware/adminMiddleware');

const app = express();
app.use(express.json());

// Static frontend
app.use('/frontend', express.static(path.join(__dirname, '..', 'frontend')));

// API routes
app.use('/api/auth', authController);
app.use('/api/admin', authMiddleware, adminMiddleware, adminController);
app.use('/api/pedidos', authMiddleware, pedidoController);
app.use('/api/users', userController);
app.use('/api/profiles', profilesController);
app.use('/api/profesionales', authMiddleware, ratingController);
app.use('/api/reclamos', authMiddleware, reclamoController);

const PORT = process.env.PORT || 3000;

initDB().then(()=>{
  app.listen(PORT, ()=>console.log('Server listening on', PORT));
}).catch(err=>{
  console.error('DB init failed', err);
});
