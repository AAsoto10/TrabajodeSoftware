class Categoria {
  constructor({id, nombre, descripcion, icono, activo, created_at}){
    this.id = id;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.icono = icono || 'bi-tools';
    this.activo = activo !== undefined ? activo : 1;
    this.created_at = created_at;
  }
}

module.exports = Categoria;
