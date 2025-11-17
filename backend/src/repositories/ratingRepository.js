const { getDB } = require('../config/database');

const createRating = async ({ pedido_id, profesional_id, cliente_id, categoria, rating, comentario }) => {
  const db = getDB();
  const res = await db.run('INSERT INTO ratings (pedido_id, profesional_id, cliente_id, categoria, rating, comentario) VALUES (?,?,?,?,?,?)', [pedido_id, profesional_id, cliente_id, categoria, rating, comentario || null]);
  return { id: res.lastID };
}

const getByPedido = async (pedidoId) => {
  const db = getDB();
  return db.get('SELECT * FROM ratings WHERE pedido_id = ?', pedidoId);
}

const getRatingsByProfesional = async (profesionalId, categoria = null) => {
  const db = getDB();
  let sql = `SELECT r.*, u.nombre as cliente_nombre
    FROM ratings r
    LEFT JOIN users u ON r.cliente_id = u.id
    WHERE r.profesional_id = ?`;
  const params = [profesionalId];
  
  if (categoria) {
    sql += ` AND lower(r.categoria) = lower(?)`;
    params.push(categoria);
  }
  
  sql += ` ORDER BY r.created_at DESC`;
  
  return db.all(sql, params);
}

const getAverageRating = async (profesionalId, categoria = null) => {
  const db = getDB();
  let sql = `SELECT COALESCE(AVG(rating), 0) as promedio, COUNT(id) as total
    FROM ratings
    WHERE profesional_id = ?`;
  const params = [profesionalId];
  
  if (categoria) {
    sql += ` AND lower(categoria) = lower(?)`;
    params.push(categoria);
  }
  
  const result = await db.get(sql, params);
  return result || { promedio: 0, total: 0 };
}

module.exports = { createRating, getByPedido, getRatingsByProfesional, getAverageRating };
