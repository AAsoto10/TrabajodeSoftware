const express = require('express');
const router = express.Router();
const profileRepo = require('../repositories/profileRepository');
const authMiddleware = require('../middleware/authMiddleware');

// Public: list approved profiles with filters (?categoria, ?zona, ?tarifaMin, ?tarifaMax, ?ratingMin)
router.get('/', async (req,res)=>{
  try{
    const filters = {
      categoria: req.query.categoria || null,
      zona: req.query.zona || null,
      tarifaMin: req.query.tarifaMin || null,
      tarifaMax: req.query.tarifaMax || null,
      ratingMin: req.query.ratingMin || null
    };
    const rows = await profileRepo.listApprovedProfiles(filters);
    res.json(rows);
  }catch(err){ res.status(500).json({ message: err.message }); }
});

// Auth required routes (mounted with authMiddleware in server)
router.get('/mine', authMiddleware, async (req,res)=>{
  try{
    const userId = req.user.id;
    const rows = await profileRepo.listProfilesByUser(userId);
    res.json(rows);
  }catch(err){ res.status(500).json({ message: err.message }); }
});

router.post('/', authMiddleware, async (req,res)=>{
  try{
    const userId = req.user.id;
    const body = req.body || {};
    // create and auto-approve for now
    const created = await profileRepo.createProfile(userId, { ...body, estado_validacion: 'aprobado' });
    res.json(created);
  }catch(err){ res.status(500).json({ message: err.message }); }
});

router.put('/:id', authMiddleware, async (req,res)=>{
  try{
    const userId = req.user.id;
    const id = Number(req.params.id);
    await profileRepo.updateProfile(id, userId, req.body || {});
    res.json({ message: 'updated' });
  }catch(err){ res.status(500).json({ message: err.message }); }
});

router.delete('/:id', authMiddleware, async (req,res)=>{
  try{
    const userId = req.user.id;
    const id = Number(req.params.id);
    await profileRepo.deleteProfile(id, userId);
    res.json({ message: 'deleted' });
  }catch(err){ res.status(500).json({ message: err.message }); }
});

module.exports = router;
