const { getDB } = require('../config/database');

/**
 * Crear un nuevo mensaje
 */
const createMensaje = async ({ pedido_id, remitente_id, destinatario_id, mensaje }) => {
  const db = getDB();
  const res = await db.run(
    'INSERT INTO mensajes (pedido_id, remitente_id, destinatario_id, mensaje, leido) VALUES (?,?,?,?,?)',
    [pedido_id, remitente_id, destinatario_id, mensaje, 0]
  );
  return { id: res.lastID };
};

/**
 * Obtener todos los mensajes de un pedido específico
 */
const getMensajesByPedido = async (pedido_id) => {
  const db = getDB();
  return db.all(`
    SELECT 
      m.*,
      u1.nombre as remitente_nombre,
      u2.nombre as destinatario_nombre
    FROM mensajes m
    LEFT JOIN users u1 ON m.remitente_id = u1.id
    LEFT JOIN users u2 ON m.destinatario_id = u2.id
    WHERE m.pedido_id = ?
    ORDER BY m.created_at ASC
  `, pedido_id);
};

/**
 * Obtener conversaciones (lista de pedidos con mensajes) para un usuario
 */
const getConversaciones = async (user_id) => {
  const db = getDB();
  return db.all(`
    SELECT DISTINCT
      p.id as pedido_id,
      p.categoria,
      p.descripcion,
      p.estado,
      CASE 
        WHEN p.cliente_id = ? THEN u2.nombre
        ELSE u1.nombre
      END as otro_usuario_nombre,
      CASE 
        WHEN p.cliente_id = ? THEN p.profesional_id
        ELSE p.cliente_id
      END as otro_usuario_id,
      (SELECT COUNT(*) FROM mensajes WHERE pedido_id = p.id AND destinatario_id = ? AND leido = 0) as mensajes_no_leidos,
      (SELECT mensaje FROM mensajes WHERE pedido_id = p.id ORDER BY created_at DESC LIMIT 1) as ultimo_mensaje,
      (SELECT created_at FROM mensajes WHERE pedido_id = p.id ORDER BY created_at DESC LIMIT 1) as ultimo_mensaje_fecha
    FROM pedidos p
    LEFT JOIN users u1 ON p.cliente_id = u1.id
    LEFT JOIN users u2 ON p.profesional_id = u2.id
    INNER JOIN mensajes m ON m.pedido_id = p.id
    WHERE p.cliente_id = ? OR p.profesional_id = ?
    ORDER BY ultimo_mensaje_fecha DESC
  `, [user_id, user_id, user_id, user_id, user_id]);
};

/**
 * Marcar mensajes como leídos
 */
const marcarComoLeido = async (pedido_id, user_id) => {
  const db = getDB();
  await db.run(
    'UPDATE mensajes SET leido = 1 WHERE pedido_id = ? AND destinatario_id = ? AND leido = 0',
    [pedido_id, user_id]
  );
};

/**
 * Obtener cantidad de mensajes no leídos para un usuario
 */
const getUnreadCount = async (user_id) => {
  const db = getDB();
  const result = await db.get(
    'SELECT COUNT(*) as count FROM mensajes WHERE destinatario_id = ? AND leido = 0',
    user_id
  );
  return result ? result.count : 0;
};

module.exports = {
  createMensaje,
  getMensajesByPedido,
  getConversaciones,
  marcarComoLeido,
  getUnreadCount
};
