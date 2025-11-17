const { getDB } = require('../config/database');

const createProfile = async (userId, fields) => {
  const db = getDB();
  const res = await db.run(
    `INSERT INTO profiles (user_id,categoria,tarifa,zona,biografia,certificados,avatar,estado_validacion) VALUES (?,?,?,?,?,?,?,?)`,
    [userId, fields.categoria || null, fields.tarifa || 0, fields.zona || null, fields.biografia || null, fields.certificados || null, fields.avatar || null, fields.estado_validacion || 'aprobado']
  );
  return { id: res.lastID, user_id: userId, ...fields };
}

const updateProfile = async (id, userId, fields) => {
  const db = getDB();
  const parts = [];
  const values = [];
  const allowed = ['categoria','tarifa','zona','biografia','certificados','avatar','estado_validacion'];
  for (const k of allowed){
    if (Object.prototype.hasOwnProperty.call(fields,k)){
      parts.push(`${k} = ?`);
      values.push(fields[k]);
    }
  }
  if (parts.length === 0) return;
  values.push(id);
  // ensure only owner can be updated by checking user_id
  const sql = `UPDATE profiles SET ${parts.join(', ')} WHERE id = ? AND user_id = ?`;
  values.push(userId);
  return db.run(sql, values);
}

const deleteProfile = async (id, userId) => {
  const db = getDB();
  return db.run('DELETE FROM profiles WHERE id = ? AND user_id = ?', [id, userId]);
}

const listProfilesByUser = async (userId) => {
  const db = getDB();
  return db.all('SELECT * FROM profiles WHERE user_id = ?', [userId]);
}

const listApprovedProfiles = async (filters = {}) => {
  const db = getDB();
  const { categoria, zona, tarifaMin, tarifaMax, ratingMin } = filters;
  
  // Build dynamic query with LEFT JOIN to ratings to calculate avg rating
  // Solo contar ratings de la misma categoría del perfil
  let sql = `
    SELECT p.*, u.nombre as usuario_nombre, u.id as usuario_id,
           COALESCE(AVG(CASE WHEN r.categoria IS NOT NULL AND lower(r.categoria) = lower(p.categoria) THEN r.rating END), 0) as rating_promedio,
           COUNT(CASE WHEN r.categoria IS NOT NULL AND lower(r.categoria) = lower(p.categoria) THEN r.id END) as total_ratings
    FROM profiles p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN ratings r ON r.profesional_id = u.id
    WHERE p.estado_validacion='aprobado'
  `;
  
  const params = [];
  
  if (categoria) {
    sql += ` AND lower(p.categoria) = lower(?)`;
    params.push(categoria);
  }
  
  if (zona) {
    sql += ` AND lower(p.zona) LIKE lower(?)`;
    params.push(`%${zona}%`);
  }
  
  if (tarifaMin !== undefined && tarifaMin !== null) {
    sql += ` AND p.tarifa >= ?`;
    params.push(Number(tarifaMin));
  }
  
  if (tarifaMax !== undefined && tarifaMax !== null) {
    sql += ` AND p.tarifa <= ?`;
    params.push(Number(tarifaMax));
  }
  
  sql += ` GROUP BY p.id`;
  
  // Filter by rating after grouping (HAVING clause)
  if (ratingMin !== undefined && ratingMin !== null) {
    sql += ` HAVING rating_promedio >= ?`;
    params.push(Number(ratingMin));
  }
  
  sql += ` ORDER BY rating_promedio DESC, p.tarifa ASC`;
  
  return db.all(sql, params);
}

module.exports = { createProfile, updateProfile, deleteProfile, listProfilesByUser, listApprovedProfiles };
