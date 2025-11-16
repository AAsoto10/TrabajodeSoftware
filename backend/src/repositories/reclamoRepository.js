const { getDB } = require('../config/database');

const createReclamo = async ({ pedido_id, cliente_id, profesional_id, motivo, descripcion }) => {
  const db = getDB();
  const res = await db.run(
    'INSERT INTO reclamos (pedido_id, cliente_id, profesional_id, motivo, descripcion, estado) VALUES (?,?,?,?,?,?)',
    [pedido_id, cliente_id, profesional_id, motivo, descripcion, 'pendiente']
  );
  return { id: res.lastID };
};

const getReclamosByCliente = async (clienteId) => {
  const db = getDB();
  return db.all(`
    SELECT r.*, 
           u.nombre as profesional_nombre,
           p.categoria as pedido_categoria,
           p.descripcion as pedido_descripcion
    FROM reclamos r
    LEFT JOIN users u ON r.profesional_id = u.id
    LEFT JOIN pedidos p ON r.pedido_id = p.id
    WHERE r.cliente_id = ?
    ORDER BY r.created_at DESC
  `, clienteId);
};

const getAllReclamos = async () => {
  const db = getDB();
  return db.all(`
    SELECT r.*, 
           c.nombre as cliente_nombre,
           c.email as cliente_email,
           u.nombre as profesional_nombre,
           u.email as profesional_email,
           p.categoria as pedido_categoria,
           p.descripcion as pedido_descripcion
    FROM reclamos r
    LEFT JOIN users c ON r.cliente_id = c.id
    LEFT JOIN users u ON r.profesional_id = u.id
    LEFT JOIN pedidos p ON r.pedido_id = p.id
    ORDER BY r.created_at DESC
  `);
};

const updateReclamoEstado = async (reclamoId, estado, respuesta) => {
  const db = getDB();
  const resolved_at = estado === 'resuelto' ? new Date().toISOString() : null;
  await db.run(
    'UPDATE reclamos SET estado = ?, respuesta_admin = ?, resolved_at = ? WHERE id = ?',
    [estado, respuesta, resolved_at, reclamoId]
  );
  return { reclamoId, estado };
};

const getReclamoById = async (reclamoId) => {
  const db = getDB();
  return db.get('SELECT * FROM reclamos WHERE id = ?', reclamoId);
};

module.exports = {
  createReclamo,
  getReclamosByCliente,
  getAllReclamos,
  updateReclamoEstado,
  getReclamoById
};
