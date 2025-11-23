const express = require('express');
const router = express.Router();
const pedidoService = require('../services/pedidoService');
const pedidoRepo = require('../repositories/pedidoRepository');
const { getDB } = require('../config/database');

console.log('pedidoController loaded. pedidoRepo keys:', pedidoRepo && Object.keys ? Object.keys(pedidoRepo) : typeof pedidoRepo);

// Crear pedido (cliente)
router.post('/', async (req,res)=>{
  try{
    const user = req.user; // from authMiddleware
    const { categoria, descripcion, precio, profesionalId } = req.body;
    const out = await pedidoService.createPedido({ cliente_id: user.id, profesional_id: profesionalId, categoria, descripcion, precio });
    res.json({ message: 'Pedido creado', id: out.id });
  }catch(err){ console.error('POST /api/pedidos error:', err); res.status(400).json({message:err.message}); }
});

// Listar pedidos del cliente autenticado
router.get('/cliente', async (req,res)=>{
  try{
    const user = req.user;
    if (!pedidoRepo || typeof pedidoRepo.listByCliente !== 'function') throw new Error('Repositorio de pedidos no disponible');
    const pedidos = await pedidoRepo.listByCliente(user.id);
    res.json(pedidos);
  }catch(err){ console.error('GET /api/pedidos/cliente error:', err); res.status(500).json({message:err.message}); }
});

// Listar pedidos asignados al profesional autenticado
router.get('/profesional', async (req,res)=>{
  try{
    const user = req.user;
    if (user.role !== 'profesional') return res.status(403).json({message:'Sólo profesionales'});
    const pedidos = await require('../repositories/pedidoRepository').listByProfesional(user.id);
    res.json(pedidos);
  }catch(err){ console.error('GET /api/pedidos/profesional error:', err); res.status(500).json({message:err.message}); }
});

// Obtener un pedido específico (para chat) - DEBE IR DESPUÉS de /cliente y /profesional
router.get('/:id', async (req,res)=>{
  try{
    const user = req.user;
    const pedidoId = req.params.id;
    const db = getDB();
    
    const pedido = await db.get(`
      SELECT p.*, 
             u1.nombre as cliente_nombre,
             u2.nombre as profesional_nombre
      FROM pedidos p
      LEFT JOIN users u1 ON p.cliente_id = u1.id
      LEFT JOIN users u2 ON p.profesional_id = u2.id
      WHERE p.id = ?
    `, pedidoId);
    
    if (!pedido) return res.status(404).json({message:'Pedido no encontrado'});
    
    // Verificar que el usuario tenga acceso
    if (pedido.cliente_id !== user.id && pedido.profesional_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({message:'No tienes acceso a este pedido'});
    }
    
    res.json(pedido);
  }catch(err){ console.error('GET /api/pedidos/:id error:', err); res.status(500).json({message:err.message}); }
});

// Profesional marca pedido como completado
router.post('/:id/complete', async (req,res)=>{
  try{
    const pedidoId = req.params.id;
    const user = req.user;
    if (user.role !== 'profesional') return res.status(403).json({message:'Sólo profesionales pueden completar pedidos'});
    const result = await pedidoService.completarPedido(pedidoId, user.id);
    res.json({ message: 'Pedido completado', result });
  }catch(err){ console.error('POST /api/pedidos/:id/complete error:', err); res.status(500).json({message:err.message}); }
});

// Asignar pedido a profesional (admin o profesional puede asignar a sí mismo)
router.post('/:id/assign', async (req,res)=>{
  try{
    const pedidoId = req.params.id;
    const user = req.user;
    let profesionalId = req.body.profesionalId;
    if (user.role === 'profesional') profesionalId = user.id;
    if (!profesionalId) return res.status(400).json({message:'Falta profesionalId'});
    // assign
    const out = await require('../repositories/pedidoRepository').assignToProfessional(pedidoId, profesionalId);
    res.json({ message: 'Pedido asignado', out });
  }catch(err){ console.error('POST /api/pedidos/:id/assign error:', err); res.status(500).json({message:err.message}); }
});

// Rechazar pedido (profesional)
router.post('/:id/reject', async (req,res)=>{
  try{
    const pedidoId = req.params.id;
    const user = req.user;
    if (user.role !== 'profesional') return res.status(403).json({message:'Sólo profesionales pueden rechazar pedidos'});
    const out = await require('../repositories/pedidoRepository').rejectPedido(pedidoId);
    res.json({ message: 'Pedido rechazado', out });
  }catch(err){ console.error('POST /api/pedidos/:id/reject error:', err); res.status(500).json({message:err.message}); }
});

// Profesional marca que el trabajo está terminado y espera pago del cliente
router.post('/:id/ready', async (req,res)=>{
  try{
    const pedidoId = req.params.id;
    const user = req.user;
    const { precio } = req.body;
    
    if (user.role !== 'profesional') return res.status(403).json({message:'Sólo profesionales pueden marcar listo para pago'});
    
    // verificar que el profesional esté asignado a este pedido
    const pedido = await require('../repositories/pedidoRepository').getPedido(pedidoId);
    if (!pedido) return res.status(404).json({message:'Pedido no encontrado'});
    if (String(pedido.profesional_id) !== String(user.id)) return res.status(403).json({message:'No estás asignado a este pedido'});
    
    // Si se envía precio, actualizarlo primero
    if (precio && Number(precio) > 0) {
      await require('../repositories/pedidoRepository').updatePrecio(pedidoId, Number(precio));
    } else if (!pedido.precio || Number(pedido.precio) <= 0) {
      return res.status(400).json({message:'Debes especificar un precio válido para el servicio'});
    }
    
    const out = await require('../repositories/pedidoRepository').markPendingPayment(pedidoId);
    res.json({ message: 'Pedido marcado pendiente de pago', out });
  }catch(err){ console.error('POST /api/pedidos/:id/ready error:', err); res.status(500).json({message:err.message}); }
});

// Cliente paga (simulado) y se completa el pedido (acepta monto opcional en body.amount)
router.post('/:id/pay', async (req,res)=>{
  try{
    const pedidoId = req.params.id;
    const user = req.user;
    console.log('POST /pay - pedidoId:', pedidoId, 'user:', user.id, 'body:', req.body);
    
    const { amount } = req.body || {};
    const pedidoRepo = require('../repositories/pedidoRepository');
    const pedido = await pedidoRepo.getPedido(pedidoId);
    
    if (!pedido) return res.status(404).json({message:'Pedido no encontrado'});
    if (String(pedido.cliente_id) !== String(user.id)) return res.status(403).json({message:'Sólo el cliente puede pagar este pedido'});
    if (pedido.estado !== 'pendiente_pago') return res.status(400).json({message:`Pedido no está pendiente de pago. Estado actual: ${pedido.estado}`});

    const monto = (typeof amount !== 'undefined' && !isNaN(Number(amount))) ? Number(amount) : (pedido.precio || 0);
    if (monto <= 0) return res.status(400).json({message:`Monto inválido: ${monto}`});

    // procesar pago simulado: actualizar precio y completar (actualiza saldo)
    const result = await pedidoRepo.processPayment(pedidoId, monto);
    res.json({ message: 'Pago simulado exitoso. Pedido completado', result });
  }catch(err){ console.error('POST /api/pedidos/:id/pay error:', err); res.status(500).json({message:err.message}); }
});

// Cliente califica un pedido completado
router.post('/:id/calificar', async (req,res)=>{
  try{
    const pedidoId = req.params.id;
    const user = req.user;
    const { rating, comentario } = req.body || {};
    const ratingVal = Number(rating);
    if (!ratingVal || ratingVal < 1 || ratingVal > 5) return res.status(400).json({message:'Rating inválido'});
    const ratingRepo = require('../repositories/ratingRepository');
    const pedido = await require('../repositories/pedidoRepository').getPedido(pedidoId);
    if (!pedido) return res.status(404).json({message:'Pedido no encontrado'});
    if (String(pedido.cliente_id) !== String(user.id)) return res.status(403).json({message:'Sólo el cliente puede calificar este pedido'});
    if (pedido.estado !== 'completado') return res.status(400).json({message:'Sólo pedidos completados pueden ser calificados'});

    // evitar calificar varias veces el mismo pedido
    const existing = await ratingRepo.getByPedido(pedidoId);
    if (existing) return res.status(400).json({message:'Este pedido ya fue calificado'});

    const out = await ratingRepo.createRating({ 
      pedido_id: pedidoId, 
      profesional_id: pedido.profesional_id, 
      cliente_id: user.id, 
      categoria: pedido.categoria, // Guardar la categoría del servicio
      rating: ratingVal, 
      comentario 
    });
    res.json({ message: 'Calificación registrada', id: out.id });
  }catch(err){ console.error('POST /api/pedidos/:id/calificar error:', err); res.status(500).json({message:err.message}); }
});

// Obtener QR de pago del profesional de un pedido
router.get('/:id/qr-pago', async (req,res)=>{
  try{
    const pedidoId = Number(req.params.id);
    const user = req.user;
    const pedido = await pedidoRepo.getById(pedidoId);
    console.log('GET /qr-pago - pedidoId:', pedidoId, 'pedido:', pedido);
    
    if (!pedido) return res.status(404).json({message:'Pedido no encontrado'});
    if (String(pedido.cliente_id) !== String(user.id)) return res.status(403).json({message:'No autorizado'});
    
    // Obtener QR del profesional
    const db = getDB();
    const profesional = await db.get('SELECT qr_pago FROM users WHERE id = ?', [pedido.profesional_id]);
    if (!profesional || !profesional.qr_pago) {
      return res.status(404).json({message:'El profesional no tiene configurado un QR de pago'});
    }
    
    const precio = Number(pedido.precio) || 0;
    console.log('Devolviendo precio:', precio, 'tipo:', typeof precio);
    res.json({ qr_pago: profesional.qr_pago, precio });
  }catch(err){ console.error('GET /api/pedidos/:id/qr-pago error:', err); res.status(500).json({message:err.message}); }
});

module.exports = router;
