const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');

// GET /api/admin/database/tables - Listar todas las tablas
router.get('/database/tables', async (req, res) => {
  try {
    const db = getDB();
    const tables = await db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);
    res.json({ success: true, tables: tables.map(t => t.name) });
  } catch (err) {
    console.error('Error al listar tablas:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/database/table/:tableName - Obtener datos de una tabla específica
router.get('/database/table/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    
    // Validar nombre de tabla para prevenir SQL injection
    const validTables = ['users', 'pedidos', 'profiles', 'ratings', 'commissions', 'reclamos'];
    if (!validTables.includes(tableName)) {
      return res.status(400).json({ success: false, message: 'Tabla no válida' });
    }

    const db = getDB();
    
    // Obtener estructura de la tabla
    const columns = await db.all(`PRAGMA table_info(${tableName})`);
    
    // Obtener datos
    const rows = await db.all(`SELECT * FROM ${tableName} ORDER BY id DESC LIMIT 100`);
    
    // Obtener total de registros
    const countResult = await db.get(`SELECT COUNT(*) as total FROM ${tableName}`);
    
    res.json({ 
      success: true, 
      tableName,
      columns: columns.map(c => ({ name: c.name, type: c.type })),
      rows,
      total: countResult.total
    });
  } catch (err) {
    console.error('Error al obtener datos de tabla:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/database/table/:tableName/row/:id - Eliminar un registro
router.delete('/database/table/:tableName/row/:id', async (req, res) => {
  try {
    const { tableName, id } = req.params;
    
    const validTables = ['users', 'pedidos', 'profiles', 'ratings', 'commissions', 'reclamos'];
    if (!validTables.includes(tableName)) {
      return res.status(400).json({ success: false, message: 'Tabla no válida' });
    }

    const db = getDB();
    await db.run(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
    
    res.json({ success: true, message: 'Registro eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar registro:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/database/table/:tableName/truncate - Vaciar tabla completa
router.post('/database/table/:tableName/truncate', async (req, res) => {
  try {
    const { tableName } = req.params;
    
    // No permitir vaciar la tabla de usuarios (por seguridad)
    const validTables = ['pedidos', 'profiles', 'ratings', 'commissions', 'reclamos'];
    if (!validTables.includes(tableName)) {
      return res.status(400).json({ success: false, message: 'No se puede vaciar esta tabla' });
    }

    const db = getDB();
    await db.run(`DELETE FROM ${tableName}`);
    await db.run(`DELETE FROM sqlite_sequence WHERE name = ?`, [tableName]);
    
    res.json({ success: true, message: `Tabla ${tableName} vaciada correctamente` });
  } catch (err) {
    console.error('Error al vaciar tabla:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
