# TrabajodeSoftware
Instrucciones para ejecutar el proyecto localmente.

Backend (Node.js + SQLite)

1. Abrir terminal en la carpeta `backend`:

```bash
cd /e/software/hogar-fix/backend
npm install
```

2. Iniciar servidor:

```bash
npm start
```

El servidor queda escuchando en `http://localhost:3000` y sirve el frontend estático en `/frontend`.

Seed:
- Se crea automáticamente un admin si no existe:
  - Email: `admin@hogarfix.local`
  - Password: `admin123`

Frontend

Abrir en el navegador:

- `http://localhost:3000/frontend/index.html` - Landing
- `http://localhost:3000/frontend/login.html` - Login
- `http://localhost:3000/frontend/register.html` - Registro

Flujo principal

- Registrar como profesional (seleccionar 'Profesional' y completar categoría).
- El admin (iniciar sesión con admin@hogarfix.local) debe aprobar al profesional desde `panel-admin.html`.
- Clientes pueden ver profesionales en `profesionales.html?categoria=...` y solicitar servicios.
- Profesionales verán pedidos asignados en `panel-profesional.html` y pueden marcarlos como completados, lo que actualiza su saldo (85% del precio).

Notas técnicas

- API base: `http://localhost:3000/api`.
- Tokens JWT almacenados en `localStorage` bajo `token`.
- DB: `backend/database.db` (SQLite).
