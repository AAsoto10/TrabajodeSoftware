class Mensaje {
  constructor({id, pedido_id, remitente_id, destinatario_id, mensaje, leido, created_at}){
    this.id = id;
    this.pedido_id = pedido_id;
    this.remitente_id = remitente_id;
    this.destinatario_id = destinatario_id;
    this.mensaje = mensaje;
    this.leido = leido || 0;
    this.created_at = created_at;
  }
}

module.exports = Mensaje;
