const { getDB } = require('../config/database');

const create = async ({nombre,email,password,role,estado_validacion,categoria})=>{
  const db = getDB();
  const res = await db.run('INSERT INTO users (nombre,email,password,role,estado_validacion,categoria) VALUES (?,?,?,?,?,?)', [nombre,email,password,role,estado_validacion||'pendiente', categoria || null]);
  return { id: res.lastID, nombre, email, role, estado_validacion };
}

const findByEmail = async (email)=>{
  const db = getDB();
  return db.get('SELECT * FROM users WHERE email = ?', email);
}

const findById = async (id)=>{
  const db = getDB();
  return db.get('SELECT * FROM users WHERE id = ?', id);
}

const approveProfessional = async (id)=>{
  const db = getDB();
  await db.run('UPDATE users SET estado_validacion = ? WHERE id = ?', ['aprobado', id]);
}

const updateSaldo = async (id, newSaldo)=>{
  const db = getDB();
  await db.run('UPDATE users SET saldo = ? WHERE id = ?', [newSaldo, id]);
}

const updateProfile = async (id, fields = {}) => {
  const db = getDB();
  const parts = [];
  const values = [];
  const allowed = ['nombre','password','categoria','tarifa','zona','biografia','certificados','avatar'];
  for (const k of allowed){
    if (Object.prototype.hasOwnProperty.call(fields,k)){
      parts.push(`${k} = ?`);
      values.push(fields[k]);
    }
  }
  if (parts.length === 0) return;
  values.push(id);
  const sql = `UPDATE users SET ${parts.join(', ')} WHERE id = ?`;
  await db.run(sql, values);
}

const listProfessionals = async (categoria)=>{
  const db = getDB();
  if (categoria) {
    // compare categories case-insensitively to match user input
    return db.all("SELECT * FROM users WHERE role='profesional' AND estado_validacion='aprobado' AND lower(categoria) = lower(?)", categoria);
  }
  return db.all("SELECT * FROM users WHERE role='profesional' AND estado_validacion='aprobado'");
}

const setCategoria = async (id, categoria)=>{
  const db = getDB();
  await db.run('UPDATE users SET categoria = ? WHERE id = ?', [categoria, id]);
}

module.exports = { create, findByEmail, findById, approveProfessional, updateSaldo, listProfessionals, setCategoria, updateProfile };
