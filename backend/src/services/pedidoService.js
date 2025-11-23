const pedidoRepo = require('../repositories/pedidoRepository');
const userRepo = require('../repositories/userRepository');

const createPedido = async ({cliente_id, profesional_id, categoria, descripcion, precio})=>{
  const res = await pedidoRepo.create({cliente_id, profesional_id, categoria, descripcion, precio});
  return res;
}

const completarPedido = async (pedidoId, profesionalId)=>{
  // delega en el repositorio que maneja la transacción
  const result = await pedidoRepo.completePedido(pedidoId, profesionalId);
  return result;
}

module.exports = { createPedido, completarPedido };
