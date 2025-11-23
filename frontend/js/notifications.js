// Sistema de notificaciones en tiempo real usando SSE
(function() {
  let eventSource = null;
  let reconnectTimeout = null;
  let isConnected = false;

  // Contenedor de notificaciones toast
  function createToastContainer() {
    if (document.getElementById('notificationToastContainer')) return;
    
    const container = document.createElement('div');
    container.id = 'notificationToastContainer';
    container.style.cssText = 'position: fixed; top: 80px; right: 20px; z-index: 9999; max-width: 400px;';
    document.body.appendChild(container);
  }

  // Mostrar notificación toast
  function showToast(notification) {
    createToastContainer();
    const container = document.getElementById('notificationToastContainer');
    
    // Determinar color según tipo
    let bgColor = 'bg-info';
    let icon = 'bi-info-circle-fill';
    
    if (notification.type === 'new_service_request') {
      bgColor = 'bg-primary';
      icon = 'bi-clipboard-check';
    } else if (notification.type === 'service_accepted') {
      bgColor = 'bg-success';
      icon = 'bi-check-circle-fill';
    } else if (notification.type === 'service_rejected') {
      bgColor = 'bg-danger';
      icon = 'bi-x-circle-fill';
    } else if (notification.type === 'ready_for_payment') {
      bgColor = 'bg-warning';
      icon = 'bi-cash-coin';
    } else if (notification.type === 'payment_receipt_uploaded') {
      bgColor = 'bg-info';
      icon = 'bi-file-earmark-image';
    } else if (notification.type === 'service_completed') {
      bgColor = 'bg-success';
      icon = 'bi-check-circle-fill';
    } else if (notification.type === 'new_message') {
      bgColor = 'bg-primary';
      icon = 'bi-chat-dots-fill';
    }
    
    const toastId = 'toast-' + Date.now();
    const toastHTML = `
      <div id="${toastId}" class="toast show mb-3" role="alert" style="min-width: 350px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
        <div class="toast-header ${bgColor} text-white">
          <i class="bi ${icon} me-2"></i>
          <strong class="me-auto">${notification.title || 'Notificación'}</strong>
          <small class="text-white-50">Ahora</small>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
        </div>
        <div class="toast-body">
          ${notification.message}
        </div>
      </div>
    `;
    
    container.insertAdjacentHTML('beforeend', toastHTML);
    
    // Reproducir sonido
    playNotificationSound();
    
    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
      const toastEl = document.getElementById(toastId);
      if (toastEl) {
        toastEl.classList.remove('show');
        setTimeout(() => toastEl.remove(), 300);
      }
    }, 5000);
    
    // Actualizar badge de notificaciones
    updateNotificationBadge();
  }

  // Reproducir sonido de notificación
  function playNotificationSound() {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2W57OmlTgwOUKfl8LZjHAU5kdTyz3osBSt+zPLaizsKFlm16OyrUxILSpzh8LxsIQUqf83y24o4CBlluu3pp04MDlGn5fC2YxwFOJHV8tB6KwUrf8zy2Ys6ChVatOnnrFQSCkqc4fC9bCEFK3/M8tuKOAgaZbjt6aZODA5Rp+TwtmMcBTmR1PLQeSsFLH7M8tmLOwoVWbTp5qxUEgpKnOHwvGwhBSt/zPLbiTgIGmW57emnTgwOUafl8LVjHAU5kdXy0HkrBSx+zPLZizsKFVm06easVBIKSpvh8LxsIQUrfs3y2ok4CBpluuzopk4MDlCn5fC2YxwFOZHU8tB5KwUsfszy2Ys7ChVZtOjnrFQSCkqc4fC8bCEFK37N8tqKOAgaZbrs6KdODA5Qp+XwtmMcBTmR1PLQeSsFLH3M8tmLOwoVWrTp561UEgpKnOHwvGwhBSt/zPLaijgIGmW67OimTgwOUKjl8LZjHAU5kdXy0HkrBSx9y/LZizsKFVq06OetVBIKSpzh8LxsIQUrfs3y2oo4CBplueropk4MDlCo5fC2YhwFOZHV8tB5LAUrdsvx2Is7ChZbtOjnrVQSCkqc4fC8bCEFK37M8tqKOQgaZbrs6KdODA5Qp+XwtmMcBTmS1fLPeSsFLHzL8dmLOwsVW7Xp561UEgpKnOLwvWwiBSp+zfLaizgIG2W67OinTgwNUKfl8LZiHAU6kdXy0HkrBSt8y/HZizsLFVu16OetVBIKSZzh8L5sIgUqfszy2os4CBtluu3op04MDU+m5fC3YhwFOpHV8s96LAUrgcvx2Is7CxZctejnrVUSCkmb4fC9bCIFKn3N8tqLOAgbZbnth6dOCw1Qp+XwtmIcBTqS1fLPeisFLIDL8dmLOwsWXLTp561VEgpJm+HwvWwiBSp9zPLaizgIG2W67YinTgsNT6fl8LZiHAU6ktXyz3osBSuAy/HZizsLFly06OetVRMKSJvh8L1tIgUqfczy2os4CBlluu2IqE4LDU+n5fC2YhwFO5LU8s96LAQrfsvy2Yt8ChdbtenorVUSCkmb4PG9bSEFK33M8tqKOAgbZbrtiKhOCw1Pp+XwtmIcBTyS1PLP'); 
      audio.volume = 0.3;
      audio.play().catch(() => {}); // Ignorar si el navegador bloquea
    } catch(e) {}
  }

  // Actualizar badge de notificaciones no leídas
  async function updateNotificationBadge() {
    try {
      const response = await window.apiRequest('/notifications/unread-count');
      const badge = document.getElementById('notificationBadge');
      if (badge && response.count > 0) {
        badge.textContent = response.count > 99 ? '99+' : response.count;
        badge.style.display = 'inline-block';
      } else if (badge) {
        badge.style.display = 'none';
      }
    } catch(err) {
      console.warn('No se pudo actualizar badge de notificaciones', err);
    }
  }

  // Conectar al stream de notificaciones
  function connect() {
    const token = sessionStorage.getItem('token');
    if (!token) {
      console.log('No hay token, no se conecta a notificaciones');
      return;
    }

    if (eventSource) {
      console.log('Ya hay una conexión activa');
      return;
    }

    console.log('🔌 Conectando a notificaciones en tiempo real...');
    
    eventSource = new EventSource('/api/notifications/stream?token=' + token);
    
    eventSource.onopen = function() {
      console.log('✅ Conectado a notificaciones en tiempo real');
      isConnected = true;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
    };
    
    eventSource.onmessage = function(event) {
      try {
        const notification = JSON.parse(event.data);
        console.log('📬 Notificación recibida:', notification);
        
        if (notification.type !== 'connected') {
          showToast(notification);
          
          // Disparar evento personalizado para que otros componentes reaccionen
          window.dispatchEvent(new CustomEvent('notification', { detail: notification }));
        }
      } catch(err) {
        console.error('Error procesando notificación:', err);
      }
    };
    
    eventSource.onerror = function(err) {
      console.error('❌ Error en conexión de notificaciones:', err);
      isConnected = false;
      
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      
      // Intentar reconectar después de 5 segundos
      if (!reconnectTimeout) {
        reconnectTimeout = setTimeout(() => {
          console.log('🔄 Intentando reconectar...');
          connect();
        }, 5000);
      }
    };
  }

  // Desconectar
  function disconnect() {
    if (eventSource) {
      console.log('🔌 Desconectando notificaciones...');
      eventSource.close();
      eventSource = null;
      isConnected = false;
    }
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
  }

  // Inicializar cuando el DOM esté listo
  document.addEventListener('DOMContentLoaded', function() {
    const token = sessionStorage.getItem('token');
    if (token) {
      connect();
      updateNotificationBadge();
      
      // Actualizar badge cada 30 segundos
      setInterval(updateNotificationBadge, 30000);
    }
  });

  // Reconectar cuando el usuario inicia sesión
  window.addEventListener('storage', function(e) {
    if (e.key === 'token') {
      if (e.newValue) {
        connect();
      } else {
        disconnect();
      }
    }
  });

  // Desconectar al cerrar sesión
  window.addEventListener('beforeunload', function() {
    disconnect();
  });

  // Exponer API global
  window.notificationManager = {
    connect,
    disconnect,
    isConnected: () => isConnected,
    updateBadge: updateNotificationBadge
  };
})();
