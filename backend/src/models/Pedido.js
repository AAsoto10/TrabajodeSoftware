class Pedido {
  constructor({id, cliente_id, profesional_id, categoria, descripcion, precio, estado, created_at}){
    this.id = id;
    this.cliente_id = cliente_id;
    this.profesional_id = profesional_id;
    this.categoria = categoria;
    this.descripcion = descripcion;
    this.precio = precio;
    this.estado = estado || 'pendiente';
    this.created_at = created_at;
  }
}

module.exports = Pedido;
