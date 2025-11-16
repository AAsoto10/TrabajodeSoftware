const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepo = require('../repositories/userRepository');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_hogarfix_2025';

const register = async ({nombre,email,password,role,categoria})=>{
  const existing = await userRepo.findByEmail(email);
  if (existing) throw new Error('Email ya registrado');
  const hash = bcrypt.hashSync(password,10);
  const estado = role === 'profesional' ? 'pendiente' : 'aprobado';
  const user = await userRepo.create({nombre,email,password:hash,role,estado_validacion:estado,categoria});
  return { message: 'Usuario creado', user };
}

const login = async ({email,password})=>{
  const user = await userRepo.findByEmail(email);
  if (!user) throw new Error('Usuario no encontrado');
  if (!bcrypt.compareSync(password, user.password)) throw new Error('Credenciales invalidas');
  
  // Verificar si la cuenta está activa
  if (user.activo === 0 || user.activo === false) {
    throw new Error('Cuenta inhabilitada por el administrador');
  }
  
  if (user.role === 'profesional' && user.estado_validacion !== 'aprobado') throw new Error('Profesional pendiente de aprobación');

  const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '8h' });
  return { token, user: { id: user.id, nombre: user.nombre, role: user.role } };
}

module.exports = { register, login };
