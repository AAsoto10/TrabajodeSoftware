# TrabajodeSoftware - HogarFix

Plataforma de servicios profesionales para el hogar.

## 🚀 Cómo iniciar el proyecto localmente

### Requisitos previos
- Node.js (v14 o superior)
- npm

### Pasos para iniciar el servidor

1. **Navegar a la carpeta del proyecto:**
```bash
cd e:/software/hogar-fix/TrabajodeSoftware/backend
```

2. **Instalar dependencias (solo la primera vez):**
```bash
npm install
```

3. **Iniciar el servidor:**
```bash
npm start
```

El servidor quedará escuchando en `http://localhost:3000` y servirá automáticamente el frontend estático desde `/frontend`.

### ⚠️ Nota importante
- Si el servidor ya está corriendo, primero detenlo presionando `Ctrl + C` en la terminal
- En Windows, si el puerto 3000 está ocupado, ejecuta: `taskkill //F //IM node.exe`

Seed:
- Se crea automáticamente un usuario admin al iniciar el servidor por primera vez:
  - **Email:** `admin@hogarfix.local`
  - **Password:** `admin123`

## 🌐 Acceder a la aplicación

Una vez iniciado el servidor, abre tu navegador en:

- **Landing page:** http://localhost:3000/frontend/index.html
- **Login:** http://localhost:3000/frontend/login.html
- **Registro:** http://localhost:3000/frontend/register.html
- **Panel Admin:** http://localhost:3000/frontend/panel-admin.html

## 📋 Flujo principal de uso

## 📋 Flujo principal de uso

1. **Registrar como profesional:** Seleccionar 'Profesional' en el registro y completar categoría
2. **Aprobar profesional:** El admin debe iniciar sesión y aprobar profesionales desde `panel-admin.html`
3. **Solicitar servicios:** Los clientes pueden ver profesionales en `profesionales.html?categoria=...` y solicitar servicios
4. **Completar trabajos:** Los profesionales verán pedidos asignados en `panel-profesional.html` y pueden marcarlos como completados, actualizando su saldo (85% del precio)

## 🔧 Notas técnicas

- **API base:** `http://localhost:3000/api`
- **Autenticación:** Tokens JWT almacenados en `sessionStorage` bajo la clave `token`
- **Sesiones:** Cada pestaña del navegador tiene su propia sesión independiente
- **Base de datos:** `backend/database.db` (SQLite)
- **Backup automático:** Se crea un backup de la base de datos cada 24 horas

## 🌍 Despliegue en producción

El proyecto está desplegado en Render:
- **URL de producción:** https://hogarfix.onrender.com
- **Configuración:** Ver archivo `render.yaml` en la raíz del proyecto
