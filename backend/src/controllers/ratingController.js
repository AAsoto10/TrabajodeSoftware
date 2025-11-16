const express = require('express');
const router = express.Router();
const ratingRepo = require('../repositories/ratingRepository');
const pedidoRepo = require('../repositories/pedidoRepository');

// GET /api/profesionales/:id/calificaciones
router.get('/:id/calificaciones', async (req,res)=>{
  try{
    const profesionalId = req.params.id;
    const ratings = await ratingRepo.getRatingsByProfesional(profesionalId);
    res.json(ratings);
  }catch(err){ console.error('GET /api/profesionales/:id/calificaciones error:', err); res.status(500).json({message:err.message}); }
});

module.exports = router;
