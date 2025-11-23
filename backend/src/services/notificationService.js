const { getDB } = require('../config/database');

// Almacenar conexiones SSE activas por usuario
const connections = new Map();

/**
 * Registra una nueva conexión SSE para un usuario
 */
function addConnection(userId, res) {
  if (!connections.has(userId)) {
    connections.set(userId, []);
  }
  connections.get(userId).push(res);
  console.log(`✅ Usuario ${userId} conectado a notificaciones. Total conexiones: ${connections.get(userId).length}`);
}

/**
 * Elimina una conexión SSE cuando se cierra
 */
function removeConnection(userId, res) {
  if (connections.has(userId)) {
    const userConnections = connections.get(userId).filter(r => r !== res);
    if (userConnections.length > 0) {
      connections.set(userId, userConnections);
    } else {
      connections.delete(userId);
    }
    console.log(`❌ Usuario ${userId} desconectado de notificaciones`);
  }
}

/**
 * Envía una notificación a un usuario específico
 */
function sendNotification(userId, notification) {
  if (!connections.has(userId)) {
    console.log(`⚠️ Usuario ${userId} no tiene conexiones activas`);
    return;
  }
  
  const userConnections = connections.get(userId);
  console.log(`📢 Enviando notificación a usuario ${userId} (${userConnections.length} conexiones)`);
  
  userConnections.forEach(res => {
    try {
      res.write(`data: ${JSON.stringify(notification)}\n\n`);
    } catch(err) {
      console.error('Error enviando notificación:', err);
    }
  });
}

/**
 * Notifica al profesional sobre nueva solicitud de servicio
 */
async function notifyNewServiceRequest(profesionalId, pedidoId) {
  try {
    const db = getDB();
    const pedido = await db.get(`
      SELECT p.*, u.nombre as cliente_nombre 
      FROM pedidos p 
      LEFT JOIN users u ON p.cliente_id = u.id 
      WHERE p.id = ?
    `, pedidoId);
    
    if (!pedido) return;
    
    sendNotification(profesionalId, {
      type: 'new_service_request',
      title: '🔔 Nueva Solicitud de Servicio',
      message: `${pedido.cliente_nombre || 'Un cliente'} solicita servicio de ${pedido.categoria}`,
      pedidoId: pedido.id,
      timestamp: new Date().toISOString()
    });
    
    // Guardar en base de datos
    await db.run(
      'INSERT INTO notifications (user_id, type, title, message, pedido_id, leido) VALUES (?, ?, ?, ?, ?, ?)',
      [profesionalId, 'new_service_request', 'Nueva Solicitud', `Servicio de ${pedido.categoria}`, pedidoId, 0]
    );
  } catch(err) {
    console.error('Error en notifyNewServiceRequest:', err);
  }
}

/**
 * Notifica al cliente cuando el profesional acepta/rechaza
 */
async function notifyServiceResponse(clienteId, pedidoId, accepted) {
  try {
    const db = getDB();
    const pedido = await db.get(`
      SELECT p.*, u.nombre as profesional_nombre 
      FROM pedidos p 
      LEFT JOIN users u ON p.profesional_id = u.id 
      WHERE p.id = ?
    `, pedidoId);
    
    if (!pedido) return;
    
    const notification = accepted ? {
      type: 'service_accepted',
      title: '✅ Solicitud Aceptada',
      message: `${pedido.profesional_nombre || 'El profesional'} aceptó tu solicitud de ${pedido.categoria}`,
      pedidoId: pedido.id,
      timestamp: new Date().toISOString()
    } : {
      type: 'service_rejected',
      title: '❌ Solicitud Rechazada',
      message: `${pedido.profesional_nombre || 'El profesional'} rechazó tu solicitud de ${pedido.categoria}`,
      pedidoId: pedido.id,
      timestamp: new Date().toISOString()
    };
    
    sendNotification(clienteId, notification);
    
    // Guardar en base de datos
    await db.run(
      'INSERT INTO notifications (user_id, type, title, message, pedido_id, leido) VALUES (?, ?, ?, ?, ?, ?)',
      [clienteId, notification.type, notification.title, notification.message, pedidoId, 0]
    );
  } catch(err) {
    console.error('Error en notifyServiceResponse:', err);
  }
}

/**
 * Notifica cuando el trabajo está listo para pago
 */
async function notifyReadyForPayment(clienteId, pedidoId) {
  try {
    const db = getDB();
    const pedido = await db.get(`
      SELECT p.*, u.nombre as profesional_nombre 
      FROM pedidos p 
      LEFT JOIN users u ON p.profesional_id = u.id 
      WHERE p.id = ?
    `, pedidoId);
    
    if (!pedido) return;
    
    sendNotification(clienteId, {
      type: 'ready_for_payment',
      title: '💰 Trabajo Terminado - Listo para Pago',
      message: `${pedido.profesional_nombre || 'El profesional'} terminó el trabajo de ${pedido.categoria}. Monto: Bs. ${pedido.precio}`,
      pedidoId: pedido.id,
      precio: pedido.precio,
      timestamp: new Date().toISOString()
    });
    
    await db.run(
      'INSERT INTO notifications (user_id, type, title, message, pedido_id, leido) VALUES (?, ?, ?, ?, ?, ?)',
      [clienteId, 'ready_for_payment', 'Listo para Pago', `Trabajo de ${pedido.categoria} - Bs. ${pedido.precio}`, pedidoId, 0]
    );
  } catch(err) {
    console.error('Error en notifyReadyForPayment:', err);
  }
}

/**
 * Notifica al profesional cuando el cliente sube comprobante
 */
async function notifyPaymentReceiptUploaded(profesionalId, pedidoId) {
  try {
    const db = getDB();
    const pedido = await db.get(`
      SELECT p.*, u.nombre as cliente_nombre 
      FROM pedidos p 
      LEFT JOIN users u ON p.cliente_id = u.id 
      WHERE p.id = ?
    `, pedidoId);
    
    if (!pedido) return;
    
    sendNotification(profesionalId, {
      type: 'payment_receipt_uploaded',
      title: '📄 Comprobante de Pago Recibido',
      message: `${pedido.cliente_nombre || 'El cliente'} subió el comprobante de pago para ${pedido.categoria}`,
      pedidoId: pedido.id,
      timestamp: new Date().toISOString()
    });
    
    await db.run(
      'INSERT INTO notifications (user_id, type, title, message, pedido_id, leido) VALUES (?, ?, ?, ?, ?, ?)',
      [profesionalId, 'payment_receipt_uploaded', 'Comprobante Recibido', `Servicio de ${pedido.categoria}`, pedidoId, 0]
    );
  } catch(err) {
    console.error('Error en notifyPaymentReceiptUploaded:', err);
  }
}

/**
 * Notifica al cliente cuando el trabajo es completado
 */
async function notifyServiceCompleted(clienteId, pedidoId) {
  try {
    const db = getDB();
    const pedido = await db.get(`
      SELECT p.*, u.nombre as profesional_nombre 
      FROM pedidos p 
      LEFT JOIN users u ON p.profesional_id = u.id 
      WHERE p.id = ?
    `, pedidoId);
    
    if (!pedido) return;
    
    sendNotification(clienteId, {
      type: 'service_completed',
      title: '✅ Trabajo Completado',
      message: `${pedido.profesional_nombre || 'El profesional'} completó el trabajo de ${pedido.categoria}. ¡Puedes calificarlo ahora!`,
      pedidoId: pedido.id,
      timestamp: new Date().toISOString()
    });
    
    await db.run(
      'INSERT INTO notifications (user_id, type, title, message, pedido_id, leido) VALUES (?, ?, ?, ?, ?, ?)',
      [clienteId, 'service_completed', 'Trabajo Completado', `Servicio de ${pedido.categoria}`, pedidoId, 0]
    );
  } catch(err) {
    console.error('Error en notifyServiceCompleted:', err);
  }
}

/**
 * Notifica nuevo mensaje en chat
 */
async function notifyNewMessage(destinatarioId, pedidoId, remitenteNombre) {
  try {
    sendNotification(destinatarioId, {
      type: 'new_message',
      title: '💬 Nuevo Mensaje',
      message: `${remitenteNombre} te envió un mensaje`,
      pedidoId: pedidoId,
      timestamp: new Date().toISOString()
    });
    
    const db = getDB();
    await db.run(
      'INSERT INTO notifications (user_id, type, title, message, pedido_id, leido) VALUES (?, ?, ?, ?, ?, ?)',
      [destinatarioId, 'new_message', 'Nuevo Mensaje', `Mensaje de ${remitenteNombre}`, pedidoId, 0]
    );
  } catch(err) {
    console.error('Error en notifyNewMessage:', err);
  }
}

module.exports = {
  addConnection,
  removeConnection,
  sendNotification,
  notifyNewServiceRequest,
  notifyServiceResponse,
  notifyReadyForPayment,
  notifyPaymentReceiptUploaded,
  notifyServiceCompleted,
  notifyNewMessage
};
