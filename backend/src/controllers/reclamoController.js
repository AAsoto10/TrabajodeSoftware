const express = require('express');
const router = express.Router();
const reclamoRepo = require('../repositories/reclamoRepository');
const pedidoRepo = require('../repositories/pedidoRepository');
const adminMiddleware = require('../middleware/adminMiddleware');

// Cliente crea un reclamo
router.post('/', async (req, res) => {
  try {
    const user = req.user;
    const { pedidoId, motivo, descripcion } = req.body;
    
    if (!pedidoId || !motivo || !descripcion) {
      return res.status(400).json({ message: 'Faltan datos requeridos' });
    }

    // Verificar que el pedido existe y pertenece al cliente
    const pedido = await pedidoRepo.getPedido(pedidoId);
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }
    if (String(pedido.cliente_id) !== String(user.id)) {
      return res.status(403).json({ message: 'No tienes permiso para reclamar este pedido' });
    }

    const reclamo = await reclamoRepo.createReclamo({
      pedido_id: pedidoId,
      cliente_id: user.id,
      profesional_id: pedido.profesional_id,
      motivo,
      descripcion
    });

    res.json({ message: 'Reclamo creado exitosamente', id: reclamo.id });
  } catch (err) {
    console.error('POST /api/reclamos error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Cliente obtiene sus reclamos
router.get('/mis-reclamos', async (req, res) => {
  try {
    const user = req.user;
    const reclamos = await reclamoRepo.getReclamosByCliente(user.id);
    res.json(reclamos);
  } catch (err) {
    console.error('GET /api/reclamos/mis-reclamos error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Admin obtiene todos los reclamos
router.get('/todos', adminMiddleware, async (req, res) => {
  try {
    const reclamos = await reclamoRepo.getAllReclamos();
    res.json(reclamos);
  } catch (err) {
    console.error('GET /api/reclamos/todos error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Admin actualiza estado de un reclamo
router.put('/:id', adminMiddleware, async (req, res) => {
  try {
    const reclamoId = req.params.id;
    const { estado, respuesta } = req.body;

    if (!estado) {
      return res.status(400).json({ message: 'Estado requerido' });
    }

    await reclamoRepo.updateReclamoEstado(reclamoId, estado, respuesta || null);
    res.json({ message: 'Reclamo actualizado' });
  } catch (err) {
    console.error('PUT /api/reclamos/:id error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
