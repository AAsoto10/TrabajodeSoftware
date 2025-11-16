const express = require('express');
const router = express.Router();
const userRepo = require('../repositories/userRepository');

// Obtener profesionales pendientes (simple)
router.get('/profesionales/pendientes', async (req,res)=>{
  try{
    const db = require('../config/database').getDB();
    const rows = await db.all("SELECT * FROM users WHERE role='profesional' AND estado_validacion='pendiente'");
    res.json(rows);
  }catch(err){ res.status(500).json({message:err.message}); }
});

router.post('/profesional/:id/aprobar', async (req,res)=>{
  try{
    const id = req.params.id;
    await userRepo.approveProfessional(id);
    res.json({ message: 'Profesional aprobado' });
  }catch(err){ res.status(500).json({message:err.message}); }
});

router.post('/profesional/:id/rechazar', async (req,res)=>{
  try{
    const id = req.params.id;
    const db = require('../config/database').getDB();
    await db.run("UPDATE users SET estado_validacion = ? WHERE id = ?", ['rechazado', id]);
    res.json({ message: 'Profesional rechazado' });
  }catch(err){ res.status(500).json({message:err.message}); }
});

// List approved professionals (for admin panel)
router.get('/profesionales', async (req,res)=>{
  try{
    const db = require('../config/database').getDB();
    const rows = await db.all("SELECT id,nombre,email,categoria,saldo,activo FROM users WHERE role='profesional' AND estado_validacion='aprobado'");
    res.json(rows);
  }catch(err){ res.status(500).json({message:err.message}); }
});

// List clients
router.get('/clientes', async (req,res)=>{
  try{
    const db = require('../config/database').getDB();
    // Check which columns exist to avoid errors on older DBs
    const cols = await db.all("PRAGMA table_info('users')");
    const colNames = cols.map(c=>c.name);
    const projection = [];
    ['id','nombre','email','activo','created_at'].forEach(c=>{ if (colNames.includes(c)) projection.push(c); });
    const projectionSql = projection.length ? projection.join(',') : '*';
    const sql = `SELECT ${projectionSql} FROM users WHERE role='cliente'`;
    const rows = await db.all(sql);
    res.json(rows);
  }catch(err){ console.error('GET /api/admin/clientes error:', err); res.status(500).json({message:err.message}); }
});

// Disable a user account
router.post('/user/:id/disable', async (req,res)=>{
  try{
    const id = req.params.id;
    const db = require('../config/database').getDB();
    await db.run('UPDATE users SET activo = 0 WHERE id = ?', id);
    res.json({ message: 'Usuario inhabilitado' });
  }catch(err){ res.status(500).json({message:err.message}); }
});

// Enable a user account
router.post('/user/:id/enable', async (req,res)=>{
  try{
    const id = req.params.id;
    const db = require('../config/database').getDB();
    await db.run('UPDATE users SET activo = 1 WHERE id = ?', id);
    res.json({ message: 'Usuario habilitado' });
  }catch(err){ res.status(500).json({message:err.message}); }
});

// Resumen estadístico para el panel admin
router.get('/resumen', async (req,res)=>{
  try{
    const db = require('../config/database').getDB();
    const total = await db.get('SELECT COUNT(*) as c FROM users');
    const profs = await db.get("SELECT COUNT(*) as c FROM users WHERE role='profesional'");
    const pendientes = await db.get("SELECT COUNT(*) as c FROM users WHERE role='profesional' AND estado_validacion='pendiente'");
    const solicitudes = await db.get('SELECT COUNT(*) as c FROM pedidos');
    const comm = await db.get('SELECT IFNULL(SUM(amount),0) as total FROM commissions');
    res.json({ total: total.c, profesionales: profs.c, pendientes: pendientes.c, solicitudes: solicitudes.c, commissions_total: comm ? comm.total : 0 });
  }catch(err){ res.status(500).json({message:err.message}); }
});

module.exports = router;
