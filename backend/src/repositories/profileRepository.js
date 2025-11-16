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

const listApprovedProfiles = async (categoria) => {
  const db = getDB();
  if (categoria) return db.all("SELECT p.*, u.nombre as usuario_nombre, u.id as usuario_id FROM profiles p JOIN users u ON p.user_id = u.id WHERE p.estado_validacion='aprobado' AND lower(p.categoria)=lower(?)", [categoria]);
  return db.all("SELECT p.*, u.nombre as usuario_nombre, u.id as usuario_id FROM profiles p JOIN users u ON p.user_id = u.id WHERE p.estado_validacion='aprobado'");
}

module.exports = { createProfile, updateProfile, deleteProfile, listProfilesByUser, listApprovedProfiles };
