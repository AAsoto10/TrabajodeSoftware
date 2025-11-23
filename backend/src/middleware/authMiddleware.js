const jwt = require('jsonwebtoken');
const { getDB } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_hogarfix_2025';

module.exports = async function (req,res,next){
  try{
    const auth = req.headers['authorization'];
    if (!auth) return res.status(401).json({message:'No token'});
    const parts = auth.split(' ');
    if (parts.length !== 2) return res.status(401).json({message:'Token inválido'});
    const token = parts[1];
    const data = jwt.verify(token, JWT_SECRET);
    // attach user minimal
    req.user = { id: data.id, role: data.role, email: data.email };
    next();
  }catch(err){ res.status(401).json({message:'Token inválido', detail: err.message}); }
}
