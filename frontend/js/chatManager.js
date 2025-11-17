/**
 * Chat Module - Sistema de mensajería en tiempo real
 * Se integra con panelCliente.js y panelProfesional.js
 */

class ChatManager {
  constructor() {
    this.currentPedidoId = null;
    this.currentDestinatarioId = null;
    this.chatPanel = null;
    this.conversacionesList = null;
    this.chatWindow = null;
    this.chatMessages = null;
    this.chatForm = null;
    this.chatInput = null;
    this.refreshInterval = null;
    this.unreadInterval = null;
  }

  init() {
    // Obtener referencias a elementos del DOM
    this.chatPanel = document.getElementById('chatPanel');
    this.conversacionesList = document.getElementById('conversacionesList');
    this.chatWindow = document.getElementById('chatWindow');
    this.chatMessages = document.getElementById('chatMessages');
    this.chatForm = document.getElementById('chatForm');
    this.chatInput = document.getElementById('chatInput');
    
    if (!this.chatPanel) {
      console.log('Chat panel not found in this page - chat disabled');
      return;
    }

    // Event listeners
    const chatToggleBtn = document.getElementById('chatToggleBtn');
    const closeChatBtn = document.getElementById('closeChatBtn');
    const backToConversationsBtn = document.getElementById('backToConversationsBtn');

    if (chatToggleBtn) {
      chatToggleBtn.addEventListener('click', () => this.toggleChat());
    }

    if (closeChatBtn) {
      closeChatBtn.addEventListener('click', () => this.closeChat());
    }

    if (backToConversationsBtn) {
      backToConversationsBtn.addEventListener('click', () => this.showConversaciones());
    }

    if (this.chatForm) {
      this.chatForm.addEventListener('submit', (e) => this.handleSendMessage(e));
    }

    // Cargar conversaciones y contador de no leídos
    this.loadConversaciones();
    this.updateUnreadBadge();

    // Auto-refresh cada 10 segundos cuando el chat está abierto
    this.startAutoRefresh();
    
    // Actualizar contador cada 30 segundos
    this.startUnreadCheck();
  }

  toggleChat() {
    if (this.chatPanel.classList.contains('active')) {
      this.closeChat();
    } else {
      this.openChat();
    }
  }

  openChat() {
    this.chatPanel.classList.add('active');
    this.loadConversaciones();
  }

  closeChat() {
    this.chatPanel.classList.remove('active');
    this.showConversaciones(); // Reset to conversations list
  }

  showConversaciones() {
    this.currentPedidoId = null;
    this.currentDestinatarioId = null;
    this.conversacionesList.classList.remove('d-none');
    this.chatWindow.classList.add('d-none');
    this.loadConversaciones();
  }

  async loadConversaciones() {
    try {
      const data = await window.apiRequest('/mensajes/conversaciones');
      
      if (!data || data.length === 0) {
        this.conversacionesList.innerHTML = `
          <div class="text-center text-muted py-5">
            <i class="bi bi-inbox" style="font-size:3rem;"></i>
            <p class="mt-2">No hay conversaciones</p>
          </div>
        `;
        return;
      }

      let html = '';
      data.forEach(conv => {
        const unreadBadge = conv.mensajes_no_leidos > 0 
          ? `<span class="badge bg-danger rounded-pill">${conv.mensajes_no_leidos}</span>` 
          : '';
        
        const lastMsg = conv.ultimo_mensaje || 'Sin mensajes';
        const truncatedMsg = lastMsg.length > 50 ? lastMsg.substring(0, 50) + '...' : lastMsg;

        html += `
          <div class="conversation-item" data-pedido-id="${conv.pedido_id}" data-user-id="${conv.otro_usuario_id}">
            <div class="d-flex justify-content-between align-items-start">
              <div class="flex-grow-1">
                <div class="fw-bold">${conv.otro_usuario_nombre || 'Usuario'}</div>
                <div class="small text-muted">${conv.categoria || 'Servicio'}</div>
                <div class="small text-secondary mt-1">${truncatedMsg}</div>
              </div>
              ${unreadBadge}
            </div>
          </div>
        `;
      });

      this.conversacionesList.innerHTML = html;

      // Agregar event listeners a cada conversación
      document.querySelectorAll('.conversation-item').forEach(item => {
        item.addEventListener('click', () => {
          const pedidoId = item.dataset.pedidoId;
          const userId = item.dataset.userId;
          this.openConversacion(pedidoId, userId);
        });
      });

    } catch (err) {
      console.error('Error loading conversaciones:', err);
      this.conversacionesList.innerHTML = `
        <div class="text-center text-danger py-4">
          <i class="bi bi-exclamation-triangle"></i>
          <p class="mt-2">Error al cargar conversaciones</p>
        </div>
      `;
    }
  }

  async openConversacion(pedidoId, destinatarioId) {
    this.currentPedidoId = pedidoId;
    this.currentDestinatarioId = destinatarioId;

    // Ocultar lista, mostrar ventana de chat
    this.conversacionesList.classList.add('d-none');
    this.chatWindow.classList.remove('d-none');

    // Cargar info del pedido y usuario
    try {
      const pedido = await window.apiRequest(`/pedidos/${pedidoId}`);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Determinar el nombre del otro usuario
      let otroUsuarioNombre = 'Usuario';
      if (pedido.cliente_id === user.id) {
        // Soy el cliente, mostrar nombre del profesional
        otroUsuarioNombre = pedido.profesional_nombre || `Profesional #${pedido.profesional_id}`;
      } else {
        // Soy el profesional, mostrar nombre del cliente
        otroUsuarioNombre = pedido.cliente_nombre || `Cliente #${pedido.cliente_id}`;
      }
      
      document.getElementById('chatUserName').textContent = otroUsuarioNombre;
      document.getElementById('chatPedidoInfo').textContent = `${pedido.categoria || 'Servicio'} - ${pedido.estado || ''}`;
    } catch (err) {
      console.error('Error loading pedido info:', err);
    }

    // Cargar mensajes
    await this.loadMensajes();

    // Auto-refresh mensajes cada 5 segundos mientras esté abierto
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    this.refreshInterval = setInterval(() => {
      if (this.currentPedidoId) {
        this.loadMensajes(false); // Sin scroll automático en refresh
      }
    }, 5000);
  }

  async loadMensajes(autoScroll = true) {
    if (!this.currentPedidoId) return;

    try {
      const mensajes = await window.apiRequest(`/mensajes/pedido/${this.currentPedidoId}`);
      
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id;

      let html = '';
      mensajes.forEach(msg => {
        const isMine = msg.remitente_id === userId;
        const alignClass = isMine ? 'message-mine' : 'message-theirs';
        const time = this.formatTime(msg.created_at);

        html += `
          <div class="message ${alignClass}">
            <div class="message-bubble">
              ${msg.mensaje}
              <div class="message-time">${time}</div>
            </div>
          </div>
        `;
      });

      if (!html) {
        html = '<div class="text-center text-muted py-4">Inicia la conversación</div>';
      }

      this.chatMessages.innerHTML = html;

      if (autoScroll) {
        this.scrollToBottom();
      }

    } catch (err) {
      console.error('Error loading mensajes:', err);
      this.chatMessages.innerHTML = `
        <div class="text-center text-danger py-4">
          Error al cargar mensajes
        </div>
      `;
    }
  }

  async handleSendMessage(e) {
    e.preventDefault();

    const mensaje = this.chatInput.value.trim();
    if (!mensaje || !this.currentPedidoId || !this.currentDestinatarioId) return;

    try {
      await window.apiRequest('/mensajes', {
        method: 'POST',
        body: JSON.stringify({
          pedido_id: this.currentPedidoId,
          destinatario_id: this.currentDestinatarioId,
          mensaje
        })
      });

      this.chatInput.value = '';
      await this.loadMensajes();

    } catch (err) {
      console.error('Error sending message:', err);
      window.showError('Error al enviar mensaje', 'Error');
    }
  }

  async updateUnreadBadge() {
    try {
      const data = await window.apiRequest('/mensajes/unread-count');
      const badge = document.getElementById('chatBadge');
      
      if (!badge) return; // Badge no existe en esta página
      
      if (data && data.count > 0) {
        badge.textContent = data.count;
        badge.classList.remove('d-none');
      } else {
        badge.classList.add('d-none');
      }
    } catch (err) {
      console.error('Error updating unread badge:', err);
    }
  }

  startAutoRefresh() {
    // Ya no usamos este intervalo general, cada conversación tiene el suyo
  }

  startUnreadCheck() {
    // Actualizar badge cada 30 segundos
    this.unreadInterval = setInterval(() => {
      this.updateUnreadBadge();
    }, 30000);
  }

  scrollToBottom() {
    if (this.chatMessages) {
      this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
  }

  formatTime(dateStr) {
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    // Si es hoy
    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    }
    
    // Si es ayer
    if (diff < 48 * 60 * 60 * 1000) {
      return 'Ayer';
    }
    
    // Fecha completa
    return date.toLocaleDateString('es', { day: '2-digit', month: '2-digit' });
  }

  // Método para abrir chat desde un pedido específico
  openChatForPedido(pedidoId, destinatarioId) {
    this.openChat();
    setTimeout(() => {
      this.openConversacion(pedidoId, destinatarioId);
    }, 300);
  }

  destroy() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    if (this.unreadInterval) clearInterval(this.unreadInterval);
  }
}

// Instancia global
window.chatManager = new ChatManager();

// Auto-init cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.chatManager.init());
} else {
  window.chatManager.init();
}
