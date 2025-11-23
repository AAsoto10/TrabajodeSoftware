class Usuario {
  constructor({id, nombre, email, password, role, estado_validacion, saldo}){
    this.id = id;
    this.nombre = nombre;
    this.email = email;
    this.password = password;
    this.role = role;
    this.estado_validacion = estado_validacion;
    this.saldo = saldo || 0;
  }
}

module.exports = Usuario;
