const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const authMiddleware = require('../middleware/authMiddleware');
const userRepo = require('../repositories/userRepository');

const bcrypt = require('bcryptjs');

router.post('/register', async (req,res)=>{
  try{
    const data = req.body;
    const out = await authService.register(data);
    res.json(out);
  }catch(err){ res.status(400).json({message: err.message}); }
});

router.post('/login', async (req,res)=>{
  try{
    const { token, user } = await authService.login(req.body);
    res.json({ token, user });
  }catch(err){ res.status(400).json({message: err.message}); }
});

// Devuelve datos del usuario autenticado
router.get('/me', authMiddleware, async (req,res)=>{
  try{
    const id = req.user && req.user.id;
    if (!id) return res.status(401).json({ message: 'No autorizado' });
    const u = await userRepo.findById(id);
    if (!u) return res.status(404).json({ message: 'Usuario no encontrado' });
    // devolver solo campos públicos
    const out = { id: u.id, nombre: u.nombre, email: u.email, role: u.role, estado_validacion: u.estado_validacion, categoria: u.categoria, saldo: u.saldo, tarifa: u.tarifa, zona: u.zona, biografia: u.biografia, certificados: u.certificados, avatar: u.avatar };
    res.json(out);
  }catch(err){ res.status(500).json({ message: err.message }); }
});

// Actualizar perfil del usuario autenticado
router.put('/me', authMiddleware, async (req,res)=>{
  try{
    const id = req.user && req.user.id;
    if (!id) return res.status(401).json({ message: 'No autorizado' });
    const { nombre, password, categoria, tarifa, zona, biografia, certificados, avatar, qr_pago } = req.body;
    const updateData = {};
    if (nombre !== undefined) updateData.nombre = nombre;
    if (categoria !== undefined) updateData.categoria = categoria;
    if (tarifa !== undefined) updateData.tarifa = tarifa;
    if (zona !== undefined) updateData.zona = zona;
    if (biografia !== undefined) updateData.biografia = biografia;
    if (certificados !== undefined) updateData.certificados = certificados;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (qr_pago !== undefined) updateData.qr_pago = qr_pago;
    if (password) updateData.password = bcrypt.hashSync(password, 10);
    await userRepo.updateProfile(id, updateData);
    // return updated public user
    const u = await userRepo.findById(id);
     // if professional created/updated profile, auto-approve so appears in listings
     if (u && u.role === 'profesional' && u.estado_validacion !== 'aprobado'){
       await userRepo.approveProfessional(id);
     }
     // return updated public user
     const u2 = await userRepo.findById(id);
    const out = { id: u2.id, nombre: u2.nombre, email: u2.email, role: u2.role, estado_validacion: u2.estado_validacion, categoria: u2.categoria, saldo: u2.saldo, tarifa: u2.tarifa, zona: u2.zona, biografia: u2.biografia, certificados: u2.certificados, avatar: u2.avatar, qr_pago: u2.qr_pago };
    res.json(out);
  }catch(err){ res.status(500).json({ message: err.message }); }
});

// Eliminar perfil profesional (limpia campos de perfil)
router.delete('/me/profile', authMiddleware, async (req,res)=>{
  try{
    const id = req.user && req.user.id;
    if (!id) return res.status(401).json({ message: 'No autorizado' });
    await userRepo.updateProfile(id, { tarifa: null, zona: null, biografia: null, certificados: null, avatar: null });
    res.json({ message: 'Perfil eliminado' });
  }catch(err){ res.status(500).json({ message: err.message }); }
});

module.exports = router;
