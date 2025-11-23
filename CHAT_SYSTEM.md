# 💬 Sistema de Chat/Mensajería - HogarFix

## 📋 Descripción

Sistema completo de mensajería en tiempo real entre clientes y profesionales de HogarFix. Permite comunicación directa relacionada con pedidos específicos.

## ✨ Características

### 🎯 Funcionalidades Principales

- **Chat en tiempo real** con actualización automática cada 5 segundos
- **Conversaciones organizadas por pedidos** 
- **Notificaciones de mensajes no leídos** con badge animado
- **Interfaz moderna** con panel lateral deslizante
- **Mensajes con timestamps** y formato de burbujas
- **Marcado automático de mensajes como leídos** al abrir conversación
- **Responsive design** - funciona en móvil y desktop

### 🔐 Seguridad

- Solo usuarios autenticados pueden enviar mensajes
- Validación de permisos: solo cliente y profesional del pedido pueden chatear
- Mensajes asociados a pedidos específicos para contexto

## 🏗️ Arquitectura

### Backend

**Modelo de Datos** (`backend/src/models/Mensaje.js`)
```javascript
{
  id: INTEGER,
  pedido_id: INTEGER,
  remitente_id: INTEGER,
  destinatario_id: INTEGER,
  mensaje: TEXT,
  leido: INTEGER (0/1),
  created_at: TIMESTAMP
}
```

**Repositorio** (`backend/src/repositories/mensajeRepository.js`)
- `createMensaje()` - Crear nuevo mensaje
- `getMensajesByPedido()` - Obtener mensajes de un pedido
- `getConversaciones()` - Lista de conversaciones del usuario
- `marcarComoLeido()` - Marcar mensajes como leídos
- `getUnreadCount()` - Contador de mensajes no leídos

**Controlador** (`backend/src/controllers/mensajeController.js`)

Rutas disponibles:
```
POST   /api/mensajes                    - Enviar mensaje
GET    /api/mensajes/pedido/:pedidoId   - Obtener mensajes de un pedido
GET    /api/mensajes/conversaciones     - Lista de conversaciones
GET    /api/mensajes/unread-count       - Contador de no leídos
POST   /api/mensajes/mark-read/:pedidoId - Marcar como leídos
```

### Frontend

**JavaScript** (`frontend/js/chatManager.js`)

Clase `ChatManager` con métodos:
- `init()` - Inicializar sistema de chat
- `toggleChat()` - Abrir/cerrar panel de chat
- `loadConversaciones()` - Cargar lista de conversaciones
- `openConversacion()` - Abrir chat específico
- `loadMensajes()` - Cargar mensajes de conversación
- `handleSendMessage()` - Enviar mensaje
- `updateUnreadBadge()` - Actualizar badge de notificaciones
- `openChatForPedido()` - Abrir chat desde botón en pedido

**HTML** 
- `panel-cliente.html` - Panel de chat para clientes
- `panel-profesional.html` - Panel de chat para profesionales

Estructura:
```html
<div id="chatPanel" class="chat-panel">
  <div class="chat-header">...</div>
  <div id="conversacionesList">...</div>
  <div id="chatWindow">
    <div class="chat-messages">...</div>
    <div class="chat-input-container">...</div>
  </div>
</div>
```

**CSS** (`frontend/CSS/style.css`)

Estilos modernos:
- Panel lateral deslizante (400px desktop, 100% móvil)
- Burbujas de mensaje con gradientes aqua
- Animaciones suaves (slide-in, bubble-pop)
- Badge pulsante para notificaciones
- Scrollbar personalizado
- Responsive design

## 🚀 Uso

### Para Clientes

1. Acceder a `panel-cliente.html`
2. Ver pedidos con profesional asignado
3. Clic en "📨 Enviar mensaje" en tarjeta de pedido
4. Se abre panel de chat lateral
5. Escribir y enviar mensajes
6. Badge muestra mensajes no leídos

### Para Profesionales

1. Acceder a `panel-profesional.html`
2. Ver pedidos asignados/activos
3. Clic en "📨 Enviar mensaje" en tarjeta de pedido
4. Se abre panel de chat lateral
5. Comunicarse con el cliente
6. Badge muestra mensajes no leídos

### Botón de Chat

Botón flotante en header:
```html
<button id="chatToggleBtn" class="btn btn-outline-info rounded-circle">
  <i class="bi bi-chat-dots"></i>
  <span id="chatBadge" class="badge bg-danger">3</span>
</button>
```

## 📱 Integración

### En tarjetas de pedidos (Cliente)

```javascript
${p.profesional_id ? `
  <button class="btn btn-sm btn-outline-info chatBtn" 
          data-pedido-id="${p.id}" 
          data-destinatario-id="${p.profesional_id}">
    <i class="bi bi-chat-dots"></i> Enviar mensaje
  </button>
` : ''}
```

### En tarjetas de pedidos (Profesional)

```javascript
${p.cliente_id ? `
  <button class="btn btn-sm btn-outline-info chatBtn" 
          data-pedido-id="${p.id}" 
          data-destinatario-id="${p.cliente_id}">
    <i class="bi bi-chat-dots"></i> Enviar mensaje
  </button>
` : ''}
```

### Event Delegation

```javascript
document.addEventListener('click', (ev) => {
  const chatBtn = ev.target.closest('.chatBtn');
  if (!chatBtn) return;
  
  const pedidoId = chatBtn.dataset.pedidoId;
  const destinatarioId = chatBtn.dataset.destinatarioId;
  
  if (window.chatManager) {
    window.chatManager.openChatForPedido(pedidoId, destinatarioId);
  }
});
```

## 🔄 Auto-Refresh

- **Mensajes**: Se actualizan cada 5 segundos cuando una conversación está abierta
- **Badge**: Se actualiza cada 30 segundos
- **Conversaciones**: Se actualizan al abrir el panel de chat

## 🎨 Diseño

### Colores Principales

- **Aqua Bright**: `#00d4ff` - Gradientes y highlights
- **Aqua Dark**: `#00a8cc` - Sombras y bordes
- **Aqua Light**: `#5ee7ff` - Hover states

### Animaciones

- Panel lateral: `cubic-bezier(0.4, 0, 0.2, 1)` 400ms
- Mensajes: `messageSlideIn` 300ms ease-out
- Burbujas: `bubblePop` 200ms ease-out
- Badge: `badgePulse` 2s infinite

## 📦 Dependencias

- Bootstrap 5.3.2 (Modal, Form components)
- Bootstrap Icons (chat-dots, send-fill, etc.)
- JavaScript ES6+ (async/await, classes)

## 🔧 Configuración

La tabla de mensajes se crea automáticamente en `database.js`:

```sql
CREATE TABLE IF NOT EXISTS mensajes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_id INTEGER,
  remitente_id INTEGER,
  destinatario_id INTEGER,
  mensaje TEXT NOT NULL,
  leido INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
  FOREIGN KEY (remitente_id) REFERENCES users(id),
  FOREIGN KEY (destinatario_id) REFERENCES users(id)
);
```

## 🐛 Solución de Problemas

### El chat no se abre
- Verificar que `chatManager.js` esté cargado antes de `panelCliente.js` / `panelProfesional.js`
- Verificar consola del navegador para errores

### Los mensajes no se actualizan
- Verificar que el backend esté corriendo
- Verificar token de autenticación en localStorage
- Revisar consola del navegador

### Badge no muestra contador
- Verificar ruta `/api/mensajes/unread-count` funcional
- Verificar que el usuario esté autenticado

## 📝 Próximas Mejoras

- [ ] WebSocket para actualizaciones en tiempo real
- [ ] Soporte para imágenes/archivos adjuntos
- [ ] Indicadores de "escribiendo..."
- [ ] Historial de mensajes paginado
- [ ] Búsqueda en conversaciones
- [ ] Notificaciones push del navegador
- [ ] Mensajes de voz
- [ ] Reacciones a mensajes (emoji)

## 👨‍💻 Autor

Sistema de Chat implementado como mejora del proyecto HogarFix.

---

**Versión**: 1.0.0  
**Fecha**: Noviembre 2025
