const express = require('express');
const router = express.Router();
const mensajeRepo = require('../repositories/mensajeRepository');

/**
 * Crear un nuevo mensaje
 * POST /api/mensajes
 * Body: { pedido_id, destinatario_id, mensaje }
 */
router.post('/', async (req, res) => {
  try {
    const user = req.user;
    const { pedido_id, destinatario_id, mensaje } = req.body;
    
    if (!pedido_id || !destinatario_id || !mensaje) {
      return res.status(400).json({ message: 'Faltan datos requeridos' });
    }

    const result = await mensajeRepo.createMensaje({
      pedido_id,
      remitente_id: user.id,
      destinatario_id,
      mensaje
    });

    res.json({ message: 'Mensaje enviado', id: result.id });
  } catch (err) {
    console.error('Error al crear mensaje:', err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * Obtener todos los mensajes de un pedido
 * GET /api/mensajes/pedido/:pedidoId
 */
router.get('/pedido/:pedidoId', async (req, res) => {
  try {
    const user = req.user;
    const pedidoId = req.params.pedidoId;
    
    // Verificar que el usuario sea parte del pedido
    const db = require('../config/database').getDB();
    const pedido = await db.get('SELECT * FROM pedidos WHERE id = ?', pedidoId);
    
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }
    
    if (pedido.cliente_id !== user.id && pedido.profesional_id !== user.id) {
      return res.status(403).json({ message: 'No tienes acceso a este chat' });
    }

    const mensajes = await mensajeRepo.getMensajesByPedido(pedidoId);
    
    // Marcar como leídos los mensajes dirigidos al usuario actual
    await mensajeRepo.marcarComoLeido(pedidoId, user.id);
    
    res.json(mensajes);
  } catch (err) {
    console.error('Error al obtener mensajes:', err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * Obtener lista de conversaciones del usuario
 * GET /api/mensajes/conversaciones
 */
router.get('/conversaciones', async (req, res) => {
  try {
    const user = req.user;
    const conversaciones = await mensajeRepo.getConversaciones(user.id);
    res.json(conversaciones);
  } catch (err) {
    console.error('Error al obtener conversaciones:', err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * Obtener cantidad de mensajes no leídos
 * GET /api/mensajes/unread-count
 */
router.get('/unread-count', async (req, res) => {
  try {
    const user = req.user;
    const count = await mensajeRepo.getUnreadCount(user.id);
    res.json({ count });
  } catch (err) {
    console.error('Error al obtener mensajes no leídos:', err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * Marcar mensajes como leídos
 * POST /api/mensajes/mark-read/:pedidoId
 */
router.post('/mark-read/:pedidoId', async (req, res) => {
  try {
    const user = req.user;
    const pedidoId = req.params.pedidoId;
    
    await mensajeRepo.marcarComoLeido(pedidoId, user.id);
    res.json({ message: 'Mensajes marcados como leídos' });
  } catch (err) {
    console.error('Error al marcar mensajes como leídos:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
