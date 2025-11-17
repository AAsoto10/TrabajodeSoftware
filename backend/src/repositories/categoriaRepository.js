const { getDB } = require('../config/database');

/**
 * Obtener todas las categorías
 */
const getAllCategorias = async () => {
  const db = getDB();
  return db.all('SELECT * FROM categorias ORDER BY nombre ASC');
};

/**
 * Obtener categorías activas
 */
const getActiveCategorias = async () => {
  const db = getDB();
  return db.all('SELECT * FROM categorias WHERE activo = 1 ORDER BY nombre ASC');
};

/**
 * Obtener una categoría por ID
 */
const getCategoriaById = async (id) => {
  const db = getDB();
  return db.get('SELECT * FROM categorias WHERE id = ?', id);
};

/**
 * Crear una nueva categoría
 */
const createCategoria = async ({ nombre, descripcion, icono }) => {
  const db = getDB();
  const res = await db.run(
    'INSERT INTO categorias (nombre, descripcion, icono, activo) VALUES (?, ?, ?, ?)',
    [nombre, descripcion || null, icono || 'bi-tools', 1]
  );
  return { id: res.lastID };
};

/**
 * Actualizar una categoría
 */
const updateCategoria = async (id, { nombre, descripcion, icono }) => {
  const db = getDB();
  const parts = [];
  const values = [];

  if (nombre !== undefined) {
    parts.push('nombre = ?');
    values.push(nombre);
  }
  if (descripcion !== undefined) {
    parts.push('descripcion = ?');
    values.push(descripcion);
  }
  if (icono !== undefined) {
    parts.push('icono = ?');
    values.push(icono);
  }

  if (parts.length === 0) return;

  values.push(id);
  const sql = `UPDATE categorias SET ${parts.join(', ')} WHERE id = ?`;
  await db.run(sql, values);
};

/**
 * Eliminar una categoría (soft delete - marcar como inactiva)
 */
const deleteCategoria = async (id) => {
  const db = getDB();
  await db.run('UPDATE categorias SET activo = 0 WHERE id = ?', id);
};

/**
 * Activar una categoría
 */
const activateCategoria = async (id) => {
  const db = getDB();
  await db.run('UPDATE categorias SET activo = 1 WHERE id = ?', id);
};

/**
 * Eliminar permanentemente una categoría
 */
const permanentDeleteCategoria = async (id) => {
  const db = getDB();
  await db.run('DELETE FROM categorias WHERE id = ?', id);
};

module.exports = {
  getAllCategorias,
  getActiveCategorias,
  getCategoriaById,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  activateCategoria,
  permanentDeleteCategoria
};
