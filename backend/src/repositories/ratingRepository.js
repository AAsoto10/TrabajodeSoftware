const { getDB } = require('../config/database');

const createRating = async ({ pedido_id, profesional_id, cliente_id, rating, comentario }) => {
  const db = getDB();
  const res = await db.run('INSERT INTO ratings (pedido_id, profesional_id, cliente_id, rating, comentario) VALUES (?,?,?,?,?)', [pedido_id, profesional_id, cliente_id, rating, comentario || null]);
  return { id: res.lastID };
}

const getByPedido = async (pedidoId) => {
  const db = getDB();
  return db.get('SELECT * FROM ratings WHERE pedido_id = ?', pedidoId);
}

const getRatingsByProfesional = async (profesionalId) => {
  const db = getDB();
  return db.all(`SELECT r.*, u.nombre as cliente_nombre
    FROM ratings r
    LEFT JOIN users u ON r.cliente_id = u.id
    WHERE r.profesional_id = ?
    ORDER BY r.created_at DESC`, profesionalId);
}

module.exports = { createRating, getByPedido, getRatingsByProfesional };
