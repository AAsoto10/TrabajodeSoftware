const express = require('express');
const router = express.Router();
const userRepo = require('../repositories/userRepository');

// Listar profesionales aprobados (opcional filtro por categoria)
router.get('/profesionales', async (req,res)=>{
  try{
    const categoria = req.query.categoria;
    const rows = await userRepo.listProfessionals(categoria);
    res.json(rows);
  }catch(err){ res.status(500).json({message:err.message}); }
});

module.exports = router;
