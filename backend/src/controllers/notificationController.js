const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');
const { getDB } = require('../config/database');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware');

// SSE endpoint para recibir notificaciones en tiempo real
router.get('/stream', (req, res) => {
  // Obtener token de query params o headers
  const token = req.query.token || (req.headers.authorization && req.headers.authorization.replace('Bearer ', ''));
  
  if (!token) {
    return res.status(401).json({ message: 'No autorizado' });
  }
  
  // Verificar token
  let userId;
  try {
    const secret = process.env.JWT_SECRET || 'secret_hogarfix_2025';
    const decoded = jwt.verify(token, secret);
    userId = decoded.id;
  } catch(err) {
    console.error('Error verificando token en notificaciones:', err.message);
    return res.status(401).json({ message: 'Token inválido' });
  }
  
  // Configurar headers para SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Para nginx
  
  // Enviar comentario inicial para mantener conexión
  res.write(': connected\n\n');
  
  // Registrar conexión
  notificationService.addConnection(userId, res);
  
  // Enviar notificación de conexión exitosa
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Conectado a notificaciones' })}\n\n`);
  
  // Limpiar conexión cuando se cierra
  req.on('close', () => {
    notificationService.removeConnection(userId, res);
    res.end();
  });
});

// Obtener historial de notificaciones del usuario
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const db = getDB();
    
    const notifications = await db.all(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [userId]
    );
    
    res.json(notifications || []);
  } catch(err) {
    console.error('Error obteniendo historial:', err);
    res.status(500).json({ message: err.message });
  }
});

// Marcar notificación como leída
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;
    const db = getDB();
    
    await db.run(
      'UPDATE notifications SET leido = 1 WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );
    
    res.json({ message: 'Notificación marcada como leída' });
  } catch(err) {
    res.status(500).json({ message: err.message });
  }
});

// Marcar todas como leídas
router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const db = getDB();
    
    await db.run(
      'UPDATE notifications SET leido = 1 WHERE user_id = ? AND leido = 0',
      [userId]
    );
    
    res.json({ message: 'Todas las notificaciones marcadas como leídas' });
  } catch(err) {
    res.status(500).json({ message: err.message });
  }
});

// Obtener contador de notificaciones no leídas
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const db = getDB();
    
    const result = await db.get(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND leido = 0',
      [userId]
    );
    
    res.json({ count: result ? result.count : 0 });
  } catch(err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
