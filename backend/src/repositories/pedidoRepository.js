const { getDB } = require('../config/database');

const create = async ({cliente_id, profesional_id, categoria, descripcion, precio, fechaHora, direccion})=>{
  const db = getDB();
  // Always start as 'pendiente' so the professional can accept the request
  const estado = 'pendiente';
  const res = await db.run('INSERT INTO pedidos (cliente_id, profesional_id, categoria, descripcion, precio, estado, fechaHora, direccion) VALUES (?,?,?,?,?,?,?,?)', [cliente_id, profesional_id || null, categoria, descripcion, precio, estado, fechaHora || null, direccion || null]);
  return { id: res.lastID };
}

const getById = async (id)=>{
  const db = getDB();
  return db.get('SELECT * FROM pedidos WHERE id = ?', id);
}

/**
 * Complete a pedido: se hace en transacción
 * Calcula comisión (15%) y actualiza saldo del profesional (85% sumado)
 */
const completePedido = async (pedidoId, profesionalId)=>{
  const db = getDB();
  try{
    await db.exec('BEGIN TRANSACTION;');
    const pedido = await db.get('SELECT * FROM pedidos WHERE id = ?', pedidoId);
    if (!pedido) throw new Error('Pedido no encontrado');

    // actualizar estado
    await db.run('UPDATE pedidos SET estado = ? , profesional_id = ? WHERE id = ?', ['completado', profesionalId, pedidoId]);

    const monto = pedido.precio || 0;
    // Platform fee: 10%
    const platformFeeRate = 0.10;
    const comision = Number((monto * platformFeeRate).toFixed(2));
    const profesionalGain = Number((monto - comision).toFixed(2));

    // obtener saldo actual
    const prof = await db.get('SELECT saldo FROM users WHERE id = ?', profesionalId);
    const currentSaldo = prof ? (prof.saldo || 0) : 0;
    const nuevoSaldo = Number((currentSaldo + profesionalGain).toFixed(2));

    await db.run('UPDATE users SET saldo = ? WHERE id = ?', [nuevoSaldo, profesionalId]);

    // Record platform commission for auditing / admin dashboard
    await db.run('INSERT INTO commissions (pedido_id, amount) VALUES (?,?)', [pedidoId, comision]);

    await db.exec('COMMIT;');
    return { pedidoId, comision, profesionalGain, nuevoSaldo };
  }catch(err){
    await db.exec('ROLLBACK;');
    throw err;
  }
}

const listByCliente = async (clienteId)=>{
  const db = getDB();
  // Join with users to get professional name (if assigned)
  return db.all(`SELECT p.*, u.nombre as profesional_nombre
    FROM pedidos p
    LEFT JOIN users u ON p.profesional_id = u.id
    WHERE p.cliente_id = ?
    ORDER BY p.created_at DESC`, clienteId);
}

const listByProfesional = async (profesionalId)=>{
  const db = getDB();
  // Join with users to get the cliente's name
  return db.all(`SELECT p.*, u.nombre as cliente_nombre
    FROM pedidos p
    LEFT JOIN users u ON p.cliente_id = u.id
    WHERE p.profesional_id = ?
    ORDER BY p.created_at DESC`, profesionalId);
}

const assignToProfessional = async (pedidoId, profesionalId)=>{
  const db = getDB();
  await db.run('UPDATE pedidos SET profesional_id = ?, estado = ? WHERE id = ?', [profesionalId, 'asignado', pedidoId]);
  return { pedidoId, profesionalId };
}

const rejectPedido = async (pedidoId)=>{
  const db = getDB();
  await db.run('UPDATE pedidos SET estado = ? WHERE id = ?', ['rechazado', pedidoId]);
  return { pedidoId, estado: 'rechazado' };
}

const markPendingPayment = async (pedidoId)=>{
  const db = getDB();
  await db.run('UPDATE pedidos SET estado = ? WHERE id = ?', ['pendiente_pago', pedidoId]);
  return { pedidoId, estado: 'pendiente_pago' };
}

const uploadComprobante = async (pedidoId, comprobanteBase64)=>{
  const db = getDB();
  await db.run('UPDATE pedidos SET comprobante_pago = ?, comprobante_verificado = 0 WHERE id = ?', [comprobanteBase64, pedidoId]);
  return { pedidoId };
}

const verifyComprobante = async (pedidoId, profesionalId)=>{
  const db = getDB();
  const pedido = await db.get('SELECT * FROM pedidos WHERE id = ?', pedidoId);
  if (!pedido) throw new Error('Pedido no encontrado');
  if (String(pedido.profesional_id) !== String(profesionalId)) throw new Error('No autorizado');
  
  await db.run('UPDATE pedidos SET comprobante_verificado = 1 WHERE id = ?', [pedidoId]);
  return { pedidoId };
}

const getPedido = async (pedidoId) => {
  const db = getDB();
  return db.get('SELECT * FROM pedidos WHERE id = ?', pedidoId);
}

const updatePrecio = async (pedidoId, amount)=>{
  const db = getDB();
  await db.run('UPDATE pedidos SET precio = ? WHERE id = ?', [amount, pedidoId]);
  return { pedidoId, precio: amount };
}

/**
 * Procesa un pago simulado: actualiza el precio del pedido y completa la transacción
 */
const processPayment = async (pedidoId, amount)=>{
  const db = getDB();
  // actualizar precio
  await updatePrecio(pedidoId, amount);
  // obtener pedido para saber el profesional asignado
  const pedido = await getPedido(pedidoId);
  if (!pedido) throw new Error('Pedido no encontrado');
  if (!pedido.profesional_id) throw new Error('Pedido sin profesional asignado');
  // delegar en completePedido que hace la transacción y actualiza saldo
  const res = await completePedido(pedidoId, pedido.profesional_id);
  return res;
}

module.exports = { create, getById, getPedido, updatePrecio, processPayment, completePedido, listByCliente, listByProfesional, assignToProfessional, rejectPedido, markPendingPayment, uploadComprobante, verifyComprobante };
