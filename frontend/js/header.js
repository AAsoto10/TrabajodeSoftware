// Header behavior: muestra estado de sesión (Iniciar Sesión / Usuario)
(function(){
  function parseJwt (token) {
    try{
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    }catch(e){ return null; }
  }

  function buildLogged(userPayload, storedUser){
    const name = (storedUser && storedUser.nombre) ? storedUser.nombre : (userPayload && userPayload.email) ? userPayload.email : 'Usuario';
    const role = (storedUser && storedUser.role) ? storedUser.role : (userPayload && userPayload.role) ? userPayload.role : 'cliente';
    const container = document.querySelector('.site-header .ms-auto');
    if (!container) return;
    container.innerHTML = `
      <div class="d-flex align-items-center gap-3">
        <div class="dropdown">
          <button class="btn btn-light rounded-circle position-relative" style="width: 40px; height: 40px; padding: 0;" id="notificationBtn" data-bs-toggle="dropdown" aria-expanded="false" title="Notificaciones">
            <i class="bi bi-bell-fill"></i>
            <span id="notificationBadge" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style="display: none; font-size: 0.65rem; padding: 0.25rem 0.4rem;">0</span>
          </button>
          <div class="dropdown-menu dropdown-menu-end p-0" aria-labelledby="notificationBtn" style="width: 380px; max-height: 500px; overflow-y: auto;">
            <div class="dropdown-header d-flex justify-content-between align-items-center bg-light">
              <h6 class="mb-0">Notificaciones</h6>
              <button class="btn btn-sm btn-link text-decoration-none" id="markAllReadBtn">Marcar todas como leídas</button>
            </div>
            <div id="notificationsList" class="list-group list-group-flush">
              <div class="text-center py-4 text-muted">
                <div class="spinner-border spinner-border-sm" role="status">
                  <span class="visually-hidden">Cargando...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="dropdown">
          <button class="btn btn-light dropdown-toggle rounded-pill px-3" id="userMenuBtn" data-bs-toggle="dropdown" aria-expanded="false">
            ${name}
          </button>
          <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userMenuBtn">
            <li><a class="dropdown-item" href="${role==='admin'? 'panel-admin.html' : role==='profesional' ? 'panel-profesional.html' : 'panel-cliente.html'}">Mi panel</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#" id="logoutLink">Cerrar sesión</a></li>
          </ul>
        </div>
      </div>
    `;
    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) logoutLink.addEventListener('click',(e)=>{ e.preventDefault(); sessionStorage.removeItem('token'); sessionStorage.removeItem('user'); window.location='index.html'; });
    
    // Cargar notificaciones cuando se abre el dropdown
    const notificationBtn = document.getElementById('notificationBtn');
    if (notificationBtn) {
      notificationBtn.addEventListener('click', loadNotifications);
    }
    
    // Marcar todas como leídas
    const markAllReadBtn = document.getElementById('markAllReadBtn');
    if (markAllReadBtn) {
      markAllReadBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          await window.apiRequest('/notifications/read-all', { method: 'PUT' });
          loadNotifications();
          if (window.notificationManager) {
            window.notificationManager.updateBadge();
          }
        } catch(err) {
          console.error('Error marcando notificaciones como leídas:', err);
        }
      });
    }
  }
  
  async function loadNotifications() {
    const container = document.getElementById('notificationsList');
    if (!container) return;
    
    try {
      const notifications = await window.apiRequest('/notifications/history');
      
      if (!notifications || notifications.length === 0) {
        container.innerHTML = `
          <div class="text-center py-4 text-muted">
            <i class="bi bi-bell-slash" style="font-size: 2rem;"></i>
            <p class="mb-0 mt-2">No hay notificaciones</p>
          </div>
        `;
        return;
      }
      
      container.innerHTML = '';
      notifications.forEach(notif => {
        const item = document.createElement('a');
        item.href = '#';
        item.className = `list-group-item list-group-item-action ${notif.leido ? '' : 'bg-light'}`;
        item.style.borderLeft = notif.leido ? 'none' : '3px solid #00d4ff';
        
        // Iconos según tipo
        let icon = 'bi-info-circle-fill';
        let iconColor = 'text-info';
        
        if (notif.type === 'new_service_request') {
          icon = 'bi-clipboard-check';
          iconColor = 'text-primary';
        } else if (notif.type === 'service_accepted') {
          icon = 'bi-check-circle-fill';
          iconColor = 'text-success';
        } else if (notif.type === 'service_rejected') {
          icon = 'bi-x-circle-fill';
          iconColor = 'text-danger';
        } else if (notif.type === 'ready_for_payment') {
          icon = 'bi-cash-coin';
          iconColor = 'text-warning';
        } else if (notif.type === 'payment_receipt_uploaded') {
          icon = 'bi-file-earmark-image';
          iconColor = 'text-info';
        } else if (notif.type === 'service_completed') {
          icon = 'bi-check-circle-fill';
          iconColor = 'text-success';
        } else if (notif.type === 'new_message') {
          icon = 'bi-chat-dots-fill';
          iconColor = 'text-primary';
        }
        
        const timeAgo = getTimeAgo(notif.created_at);
        
        item.innerHTML = `
          <div class="d-flex align-items-start">
            <i class="bi ${icon} ${iconColor} me-3" style="font-size: 1.5rem;"></i>
            <div class="flex-grow-1">
              <div class="d-flex justify-content-between align-items-start">
                <strong class="mb-1">${notif.title}</strong>
                <small class="text-muted">${timeAgo}</small>
              </div>
              <p class="mb-0 small text-muted">${notif.message}</p>
            </div>
          </div>
        `;
        
        item.addEventListener('click', async (e) => {
          e.preventDefault();
          // Marcar como leída
          if (!notif.leido) {
            try {
              await window.apiRequest(`/notifications/${notif.id}/read`, { method: 'PUT' });
              item.classList.remove('bg-light');
              item.style.borderLeft = 'none';
              if (window.notificationManager) {
                window.notificationManager.updateBadge();
              }
            } catch(err) {
              console.error('Error marcando notificación como leída:', err);
            }
          }
          
          // Redirigir según el tipo
          if (notif.pedido_id) {
            const user = JSON.parse(sessionStorage.getItem('user') || '{}');
            
            // Si es un mensaje, guardar el pedido_id para abrir el chat automáticamente
            if (notif.type === 'new_message') {
              sessionStorage.setItem('openChatPedidoId', notif.pedido_id);
            }
            
            if (user.role === 'profesional') {
              window.location.href = 'panel-profesional.html';
            } else if (user.role === 'cliente') {
              window.location.href = 'panel-cliente.html';
            }
          }
        });
        
        container.appendChild(item);
      });
    } catch(err) {
      console.error('Error cargando notificaciones:', err);
      container.innerHTML = `
        <div class="text-center py-4 text-danger">
          <i class="bi bi-exclamation-triangle" style="font-size: 2rem;"></i>
          <p class="mb-0 mt-2">Error cargando notificaciones</p>
        </div>
      `;
    }
  }
  
  function getTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = Math.floor((now - time) / 1000); // segundos
    
    if (diff < 60) return 'Ahora';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    if (diff < 604800) return `Hace ${Math.floor(diff / 86400)} días`;
    return time.toLocaleDateString();
  }

  function buildAnonymous(){
    const container = document.querySelector('.site-header .ms-auto');
    if (!container) return;
    container.innerHTML = `<a href="login.html" class="btn btn-info rounded-pill px-4">Iniciar Sesión</a>`;
  }

  document.addEventListener('DOMContentLoaded', async ()=>{
    const token = sessionStorage.getItem('token');
    const storedUser = sessionStorage.getItem('user') ? JSON.parse(sessionStorage.getItem('user')) : null;
    if (token){
      // Try authoritative backend call first
      try{
        const res = await fetch('/api/auth/me', { headers: { 'Authorization': 'Bearer ' + token } });
        if (res.ok){
          const user = await res.json();
          buildLogged(user, user);
          return;
        }
      }catch(e){ /* ignore and fallback to token parse */ }

      const payload = parseJwt(token);
      buildLogged(payload, storedUser);
    }else{
      buildAnonymous();
    }

    // listen for profile updates from other scripts
    window.addEventListener('profileUpdated', ()=>{
      const stored = sessionStorage.getItem('user') ? JSON.parse(sessionStorage.getItem('user')) : null;
      const token2 = sessionStorage.getItem('token');
      const payload = token2 ? parseJwt(token2) : null;
      buildLogged(payload, stored);
    });
  });
})();
