document.addEventListener('DOMContentLoaded', async ()=>{
  const pedidosEl = document.getElementById('pedidosList');
  const servicesGrid = document.getElementById('servicesGrid');
  const profileBtn = document.getElementById('profileBtn');
  const profileModal = new bootstrap.Modal(document.getElementById('profileModal'));
  const profileForm = document.getElementById('profileForm');
  const profileModalTitle = document.getElementById('profileModalTitle');
  const profileSaveBtn = document.getElementById('profileSaveBtn');

  const token = sessionStorage.getItem('token');
  if (!token) { window.location = 'login.html'; return; }

  // load current user basic info
  let user = null;
  
  // Función para recargar los datos del usuario
  async function reloadUser() {
    try {
      user = await window.apiRequest('/auth/me');
      console.log('Usuario recargado:', user); // Debug
      return user;
    } catch(err) {
      console.warn('No se pudo recargar usuario', err);
      return null;
    }
  }
  
  try{
    user = await window.apiRequest('/auth/me');
  }catch(err){
    if (err && err.status === 401) { window.location = 'login.html'; return; }
    console.warn('No se pudo cargar usuario', err);
  }

  // manage editing state
  let currentEditingProfileId = null;

  // Cargar categorías dinámicamente en el select
  async function loadCategorias() {
    try {
      const response = await fetch('http://localhost:3000/api/categorias/activas');
      if (!response.ok) throw new Error('Error al cargar categorías');
      
      const categorias = await response.json();
      const selectCategoria = document.getElementById('p_categoria');
      
      if (categorias && categorias.length > 0) {
        selectCategoria.innerHTML = '';
        categorias.forEach(cat => {
          const option = document.createElement('option');
          option.value = cat.nombre;
          option.textContent = cat.nombre;
          selectCategoria.appendChild(option);
        });
      }
    } catch(err) {
      console.error('Error cargando categorías:', err);
      // Mantener opciones por defecto si hay error
    }
  }

  // Cargar categorías al iniciar
  await loadCategorias();

  // fetch and render profiles for this user
  async function fetchAndRenderProfiles(){
    try{
      const profiles = await window.apiRequest('/profiles/mine');
      if (!profiles || profiles.length === 0){
        servicesGrid.innerHTML = `<div class="col-12"><div class="card p-3 text-center">No tienes perfil todavía. Usa \"Insertar perfil\" para crearlo.</div></div>`;
        return;
      }
      servicesGrid.innerHTML = '';
      profiles.forEach(p=>{
        const avatar = p.avatar || 'https://via.placeholder.com/80';
        const col = document.createElement('div'); col.className='col-md-6 col-lg-3';
        col.innerHTML = `
          <div class="card p-3 h-100">
            <div class="d-flex align-items-center gap-3">
              <img src="${avatar}" alt="avatar" width="64" height="64" style="border-radius:50%" onerror="this.onerror=null;this.src='https://via.placeholder.com/80'"/>
              <div>
                <strong>${user ? user.nombre : 'Tú'}</strong>
                <div class="small text-muted">${p.categoria}</div>
                <div class="mt-1">${p.zona ? '<i class="bi bi-geo-alt"></i> '+p.zona : ''}</div>
              </div>
            </div>
            <hr />
            <div class="mt-2">
              <h4 class="text-info">Bs. ${p.tarifa || 0}</h4>
              <div class="d-flex gap-2 mt-2">
                <button class="btn btn-sm btn-primary editProfileBtn" data-id="${p.id}">Editar</button>
                <button class="btn btn-sm btn-danger deleteProfileBtn" data-id="${p.id}">Eliminar</button>
              </div>
            </div>
          </div>`;
        servicesGrid.appendChild(col);
      });

      // attach handlers
      document.querySelectorAll('.editProfileBtn').forEach(btn=>btn.addEventListener('click', async (ev)=>{
        const id = ev.currentTarget.dataset.id;
        // load profile data
        const profiles = await window.apiRequest('/profiles/mine');
        const profile = profiles.find(x=>String(x.id) === String(id));
        if (!profile) return window.showError('Perfil no encontrado', 'Error');
        currentEditingProfileId = profile.id;
        const selectCategoria = document.getElementById('p_categoria');
        if (profile.categoria) {
          selectCategoria.value = profile.categoria;
        }
        document.getElementById('p_tarifa').value = profile.tarifa || '';
        document.getElementById('p_zona').value = profile.zona || '';
        document.getElementById('p_bio').value = profile.biografia || '';
        document.getElementById('p_certs').value = profile.certificados || '';
        document.getElementById('p_avatar').value = profile.avatar || '';
        document.getElementById('p_avatar_file').value = '';
        document.getElementById('avatarPreview').style.display = 'none';
        if (profileModalTitle) profileModalTitle.textContent = 'Editar perfil profesional';
        if (profileSaveBtn) profileSaveBtn.textContent = 'Guardar perfil';
        profileModal.show();
      }));

      document.querySelectorAll('.deleteProfileBtn').forEach(btn=>btn.addEventListener('click', async (ev)=>{
        const id = ev.currentTarget.dataset.id;
        window.showConfirm('¿Eliminar este perfil profesional?', async () => {
          try{
            await window.apiRequest(`/profiles/${id}`, { method: 'DELETE' });
            window.showSuccess('Perfil eliminado correctamente');
            setTimeout(() => fetchAndRenderProfiles(), 600);
          }catch(err){ window.showError(err.message || 'Error al eliminar el perfil', 'Error'); }
        });
      }));

    }catch(err){
      servicesGrid.innerHTML = '<div class="col-12"><div class="alert alert-warning">No se pudieron cargar tus perfiles. Inténtalo más tarde.</div></div>';
    }
  }

  // initial render of profiles
  await fetchAndRenderProfiles();

  // Insert mode: always open empty form
  profileBtn.addEventListener('click', ()=>{
    currentEditingProfileId = null;
    const selectCategoria = document.getElementById('p_categoria');
    if (selectCategoria.options.length > 0) {
      selectCategoria.selectedIndex = 0;
    }
    document.getElementById('p_tarifa').value = '';
    document.getElementById('p_zona').value = '';
    document.getElementById('p_bio').value = '';
    document.getElementById('p_certs').value = '';
    document.getElementById('p_avatar').value = '';
    document.getElementById('p_avatar_file').value = '';
    document.getElementById('avatarPreview').style.display = 'none';
    if (profileModalTitle) profileModalTitle.textContent = 'Insertar perfil profesional';
    if (profileSaveBtn) profileSaveBtn.textContent = 'Insertar perfil';
    profileModal.show();
  });

  // Preview de imagen cuando se selecciona un archivo
  document.getElementById('p_avatar_file').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(event) {
        document.getElementById('avatarPreviewImg').src = event.target.result;
        document.getElementById('avatarPreview').style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  });

  profileForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    
    // Determinar el avatar (URL o archivo)
    let avatarValue = document.getElementById('p_avatar').value;
    const avatarFile = document.getElementById('p_avatar_file').files[0];
    
    if (avatarFile) {
      // Si hay un archivo, convertirlo a base64
      const reader = new FileReader();
      avatarValue = await new Promise((resolve) => {
        reader.onload = (event) => resolve(event.target.result);
        reader.readAsDataURL(avatarFile);
      });
    }
    
    const body = {
      categoria: document.getElementById('p_categoria').value,
      tarifa: Number(document.getElementById('p_tarifa').value)||0,
      zona: document.getElementById('p_zona').value,
      biografia: document.getElementById('p_bio').value,
      certificados: document.getElementById('p_certs').value,
      avatar: avatarValue
    };
    try{
      if (currentEditingProfileId){
        await window.apiRequest(`/profiles/${currentEditingProfileId}`, { method: 'PUT', body: JSON.stringify(body) });
        window.showSuccess('Perfil actualizado correctamente', '¡Actualizado!');
      }else{
        await window.apiRequest('/profiles', { method: 'POST', body: JSON.stringify(body) });
        window.showSuccess('Perfil creado correctamente', '¡Perfil Creado!');
      }
      profileModal.hide();
      // refresh list
      setTimeout(async () => {
        await fetchAndRenderProfiles();
        window.dispatchEvent(new Event('profileUpdated'));
      }, 600);
    }catch(err){
      window.showError(err.message||'Error guardando perfil', 'Error');
    }
  });

  // 2) cargar pedidos asignados al profesional (sección separada)
  try{
    const pedidos = await window.apiRequest('/pedidos/profesional');
    console.log('Pedidos recibidos:', pedidos); // Debug
    
    // render stats and tabs
    async function renderStatsAndTabs(pedidosList){
      // Recargar datos del usuario para obtener el saldo actualizado
      await reloadUser();
      
      const pending = pedidosList.filter(p=>p.estado === 'pendiente').length;
      const assigned = pedidosList.filter(p=>p.estado === 'asignado').length;
      const completed = pedidosList.filter(p=>p.estado === 'completado').length;
      
      // Calcular ganancias por categoría de pedidos completados
      const gananciasPorCategoria = {};
      const pedidosCompletados = pedidosList.filter(p => p.estado === 'completado' && p.precio);
      
      console.log('Pedidos completados:', pedidosCompletados); // Debug
      
      // Calcular saldo total basado SOLO en los pedidos completados de este profesional
      let saldoCalculado = 0;
      
      pedidosCompletados.forEach(p => {
        const categoria = p.categoria || 'Sin categoría';
        const precioTotal = parseFloat(p.precio) || 0;
        // El backend usa 10% de comisión, así que el profesional recibe (precio - 10%)
        const comision = precioTotal * 0.10;
        const ganancia = precioTotal - comision;
        
        // Sumar al saldo total calculado
        saldoCalculado += ganancia;
        
        if (!gananciasPorCategoria[categoria]) {
          gananciasPorCategoria[categoria] = {
            total: 0,
            trabajos: 0,
            precioTotal: 0
          };
        }
        gananciasPorCategoria[categoria].total += ganancia;
        gananciasPorCategoria[categoria].trabajos += 1;
        gananciasPorCategoria[categoria].precioTotal += precioTotal;
      });
      
      // Usar el saldo calculado en lugar del saldo del backend
      const saldo = saldoCalculado;
      
      console.log('Ganancias por categoría:', gananciasPorCategoria); // Debug
      console.log('Saldo calculado:', saldo); // Debug
      
      // fetch ratings for this professional
      let ratings = [];
      try{ ratings = await window.apiRequest(`/profesionales/${user.id}/calificaciones`); }catch(e){ console.warn('No se pudieron cargar calificaciones', e); }
      const ratingsCount = ratings ? ratings.length : 0;
      const ratingsAvg = ratingsCount ? (ratings.reduce((s,r)=>s + (r.rating||0),0) / ratingsCount) : 0;
      const statsHtml = `
        <div class="row g-3 mb-3">
          <div class="col-md-4">
            <div class="stat-card-pro">
              <div class="stat-icon-pro">
                <i class="bi bi-star-fill"></i>
              </div>
              <div class="stat-label-pro">Calificación Promedio</div>
              <div class="stat-value-pro">${ratingsAvg.toFixed(1)}</div>
              <div class="small text-muted mt-2">${ratingsCount} calificaciones</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="stat-card-pro">
              <div class="stat-icon-pro">
                <i class="bi bi-hourglass-split"></i>
              </div>
              <div class="stat-label-pro">Solicitudes Pendientes</div>
              <div class="stat-value-pro">${pending}</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="stat-card-pro">
              <div class="stat-icon-pro">
                <i class="bi bi-clipboard-check"></i>
              </div>
              <div class="stat-label-pro">Trabajos Activos</div>
              <div class="stat-value-pro">${assigned}</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="stat-card-pro">
              <div class="stat-icon-pro">
                <i class="bi bi-wallet2"></i>
              </div>
              <div class="stat-label-pro">Saldo disponible</div>
              <div class="stat-value-pro">Bs. ${saldo.toFixed ? saldo.toFixed(2) : saldo}</div>
            </div>
          </div>
        </div>
        <ul class="nav nav-tabs mb-3" id="profTab" role="tablist">
          <li class="nav-item" role="presentation"><button class="nav-link active" data-bs-toggle="tab" data-bs-target="#tab-pendientes" type="button">Pendientes</button></li>
          <li class="nav-item" role="presentation"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-activos" type="button">Activos</button></li>
          <li class="nav-item" role="presentation"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-saldo" type="button">Mi Saldo</button></li>
          <li class="nav-item" role="presentation"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-calificaciones" type="button">Calificaciones</button></li>
        </ul>
        <div class="tab-content">
          <div class="tab-pane fade show active" id="tab-pendientes"></div>
          <div class="tab-pane fade" id="tab-activos"></div>
          <div class="tab-pane fade" id="tab-saldo"></div>
          <div class="tab-pane fade" id="tab-calificaciones">
            ${ratingsCount === 0 ? 'No hay calificaciones aún' : '<div id="ratingsList"></div>'}
          </div>
        </div>`;
      document.getElementById('statsContainer').innerHTML = statsHtml;
      
      // Renderizar desglose de saldo por categoría
      const tabSaldo = document.getElementById('tab-saldo');
      if (Object.keys(gananciasPorCategoria).length === 0) {
        tabSaldo.innerHTML = `
          <div class="card p-4 text-center">
            <i class="bi bi-wallet" style="font-size: 3rem; color: #00d4ff;"></i>
            <h5 class="mt-3 text-muted">No hay ganancias registradas aún</h5>
            <p class="text-muted">Completa trabajos para ver tus ganancias por categoría</p>
          </div>`;
      } else {
        let saldoHtml = `
          <div class="card p-4">
            <h5 class="mb-4">
              <i class="bi bi-cash-stack text-success"></i> 
              Ganancias por Tipo de Servicio
            </h5>
            <div class="row g-3">`;
        
        for (const [categoria, datos] of Object.entries(gananciasPorCategoria)) {
          const iconos = {
            'Electricidad': 'bi-lightning-charge-fill',
            'Plomería': 'bi-droplet-fill',
            'Carpintería': 'bi-hammer',
            'Pintura': 'bi-brush-fill',
            'Jardinería': 'bi-tree-fill',
            'Limpieza': 'bi-wind',
            'Albañilería': 'bi-bricks'
          };
          const icono = iconos[categoria] || 'bi-tools';
          const comisionTotal = datos.precioTotal - datos.total;
          
          saldoHtml += `
            <div class="col-md-6 col-lg-4">
              <div class="card h-100" style="border-left: 4px solid #00d4ff; box-shadow: 0 2px 8px rgba(0,212,255,0.1); transition: all 0.3s ease;">
                <div class="card-body">
                  <div class="d-flex align-items-center gap-3 mb-3">
                    <div style="width: 50px; height: 50px; border-radius: 12px; background: linear-gradient(135deg, #e0f7ff 0%, #f0f9ff 100%); display: flex; align-items: center; justify-content: center;">
                      <i class="bi ${icono}" style="font-size: 1.5rem; color: #00d4ff;"></i>
                    </div>
                    <div class="flex-grow-1">
                      <div class="small text-muted">Categoría</div>
                      <strong style="font-size: 1.1rem;">${categoria}</strong>
                    </div>
                  </div>
                  <hr>
                  <div class="row g-2">
                    <div class="col-6">
                      <div class="small text-muted mb-1">Precio Total</div>
                      <div class="fw-bold text-primary">Bs. ${datos.precioTotal.toFixed(2)}</div>
                    </div>
                    <div class="col-6">
                      <div class="small text-muted mb-1">Comisión (10%)</div>
                      <div class="fw-bold text-danger">- Bs. ${comisionTotal.toFixed(2)}</div>
                    </div>
                    <div class="col-12">
                      <hr class="my-2">
                    </div>
                    <div class="col-6">
                      <div class="small text-muted mb-1">Tu Ganancia</div>
                      <h4 class="mb-0 text-success fw-bold">Bs. ${datos.total.toFixed(2)}</h4>
                    </div>
                    <div class="col-6">
                      <div class="small text-muted mb-1">Trabajos</div>
                      <h5 class="mb-0 text-info fw-bold">${datos.trabajos}</h5>
                    </div>
                  </div>
                </div>
              </div>
            </div>`;
        }
        
        // Calcular el total de las categorías mostradas
        const totalCalculado = Object.values(gananciasPorCategoria).reduce((sum, datos) => sum + datos.total, 0);
        
        saldoHtml += `
            </div>
            <hr class="my-4">
            <div class="row">
              <div class="col-12">
                <div class="card" style="background: linear-gradient(135deg, #00d4ff 0%, #00a8cc 100%); border: none;">
                  <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center text-white">
                      <div>
                        <div class="mb-2 opacity-75" style="font-size: 0.9rem; font-weight: 500;">💰 SALDO TOTAL DE TUS TRABAJOS</div>
                        <h1 class="mb-1 fw-bold" style="font-size: 3rem;">Bs. ${saldo.toFixed(2)}</h1>
                        <small class="opacity-90">Total ganado de ${pedidosCompletados.length} trabajo${pedidosCompletados.length !== 1 ? 's' : ''} completado${pedidosCompletados.length !== 1 ? 's' : ''}</small>
                      </div>
                      <div style="width: 80px; height: 80px; border-radius: 50%; background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; border: 3px solid rgba(255,255,255,0.3);">
                        <i class="bi bi-wallet2" style="font-size: 2.5rem; color: white;"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="alert alert-info mt-3" role="alert">
              <i class="bi bi-info-circle-fill me-2"></i>
              <strong>Nota:</strong> La plataforma retiene el 10% por cada servicio completado como comisión.
            </div>
          </div>`;
        
        tabSaldo.innerHTML = saldoHtml;
        
        // Agregar efecto hover a las tarjetas
        document.querySelectorAll('#tab-saldo .card').forEach(card => {
          card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 8px 24px rgba(0,212,255,0.2)';
          });
          card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 2px 8px rgba(0,212,255,0.1)';
          });
        });
      }

      const tabPendientes = document.getElementById('tab-pendientes');
      const tabActivos = document.getElementById('tab-activos');
      tabPendientes.innerHTML = '';
      tabActivos.innerHTML = '';

      function formatDate(d){
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return d || '';
        const pad = n=> n<10 ? '0'+n : n;
        return `${pad(dt.getDate())}/${pad(dt.getMonth()+1)}/${dt.getFullYear()}, ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
      }

      pedidosList.forEach(p=>{
        const card = document.createElement('div'); card.className='card p-3 mb-3';
        // build action buttons depending on estado
        let actions = '';
        if (p.estado === 'pendiente'){
          actions = `<button class="btn btn-success btn-sm acceptBtn" data-id="${p.id}"><i class="bi bi-check-lg"></i> Aceptar</button> <button class="btn btn-danger btn-sm rejectBtn" data-id="${p.id}"><i class="bi bi-x-lg"></i> Rechazar</button>`;
        } else if (p.estado === 'asignado'){
          // ahora el profesional marca listo para pago (cliente debe pagar luego)
          actions = `<button class="btn btn-success btn-sm readyBtn" data-id="${p.id}"><i class="bi bi-check-circle"></i> Marcar listo para pago</button>`;
        } else if (p.estado === 'completado'){
          actions = `<span class="badge bg-success">Completado</span>`;
        } else {
          actions = `<span class="badge bg-secondary">${p.estado}</span>`;
        }

        const cliente = p.cliente_nombre || ('Cliente: ' + (p.cliente_id || 'Desconocido'));
        const fecha = p.fechaHora || p.created_at || null;
        const direccion = p.direccion || null;

        card.innerHTML = `
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <strong>${p.categoria || 'Servicio'}</strong>
              <div class="small text-muted mt-1">${p.descripcion || ''}</div>
              <div class="mt-3 small text-muted"><i class="bi bi-person-fill"></i> ${cliente}</div>
              ${direccion ? `<div class="small text-muted"><i class="bi bi-geo-alt-fill"></i> ${direccion}</div>` : ''}
              ${fecha ? `<div class="small text-muted"><i class="bi bi-calendar-event"></i> ${formatDate(fecha)}</div>` : ''}
              ${p.cliente_id ? `<div class="mt-2"><button class="btn btn-sm btn-outline-info chatBtn" data-pedido-id="${p.id}" data-destinatario-id="${p.cliente_id}"><i class="bi bi-chat-dots"></i> Enviar mensaje</button></div>` : ''}
            </div>
            <div class="text-end">${actions}</div>
          </div>`;
        if (p.estado === 'pendiente') tabPendientes.appendChild(card);
        else tabActivos.appendChild(card);
      });

      // attach accept handlers for pendientes
      tabPendientes.querySelectorAll('.acceptBtn').forEach(btn=>btn.addEventListener('click', async (ev)=>{
        const id = ev.currentTarget.dataset.id;
        try{
          await window.apiRequest(`/pedidos/${id}/assign`, { method: 'POST' });
          window.showSuccess('Solicitud aceptada correctamente', '¡Aceptado!');
          // refresh pedidos list and user data
          setTimeout(async () => {
            await reloadUser();
            const newPedidos = await window.apiRequest('/pedidos/profesional');
            renderStatsAndTabs(newPedidos);
          }, 600);
        }catch(err){ window.showError(err.message||'Error al aceptar la solicitud', 'Error'); }
      }));

      // attach reject handlers for pendientes
      tabPendientes.querySelectorAll('.rejectBtn').forEach(btn=>btn.addEventListener('click', async (ev)=>{
        const id = ev.currentTarget.dataset.id;
        window.showConfirm('¿Estás seguro de que deseas rechazar esta solicitud?', async () => {
          try{
            await window.apiRequest(`/pedidos/${id}/reject`, { method: 'POST' });
            window.showSuccess('Solicitud rechazada', 'Rechazado');
            setTimeout(async () => {
              await reloadUser();
              const newPedidos = await window.apiRequest('/pedidos/profesional');
              renderStatsAndTabs(newPedidos);
            }, 600);
          }catch(err){ window.showError(err.message||'Error al rechazar la solicitud', 'Error'); }
        }, '¿Rechazar Solicitud?');
      }));

      // attach ready handlers for activos (marcar pendiente de pago)
      tabActivos.querySelectorAll('.readyBtn').forEach(btn=>btn.addEventListener('click', async (ev)=>{
        const id = ev.currentTarget.dataset.id;
        try{ 
          await window.apiRequest(`/pedidos/${id}/ready`, { method:'POST' }); 
          window.showSuccess('Pedido marcado como <strong>pendiente de pago</strong>', '¡Listo!');
          setTimeout(async () => {
            const newPedidos = await window.apiRequest('/pedidos/profesional');
            renderStatsAndTabs(newPedidos);
          }, 600);
        }
        catch(err){ window.showError(err.message||'Error al marcar listo para pago', 'Error'); }
      }));

      // render ratings into tab-calificaciones
      const ratingsContainer = document.getElementById('ratingsList');
      if (ratingsContainer){
        if (!ratings || ratings.length === 0) ratingsContainer.innerHTML = 'No hay calificaciones aún';
        else {
          ratingsContainer.innerHTML = '';
          ratings.forEach(r=>{
            const card = document.createElement('div'); card.className='card p-3 mb-2';
            const fecha = r.created_at ? formatDate(r.created_at) : '';
            const cliente = r.cliente_nombre || 'Cliente';
            const categoriaServicio = r.categoria ? `<span class="badge bg-secondary">${r.categoria}</span>` : '';
            card.innerHTML = `<div class="d-flex justify-content-between align-items-center mb-2"><div><strong>${r.rating} ★</strong> ${categoriaServicio}</div><div class="small text-muted">${fecha}</div></div><div class="small text-muted mb-2">Cliente: ${cliente}</div><div>${r.comentario || '<em class="text-muted">Sin comentario</em>'}</div>`;
            ratingsContainer.appendChild(card);
          });
        }
      }
    }

    renderStatsAndTabs(pedidos);
  }catch(err){
    pedidosEl.innerHTML = '<div class="alert alert-warning">No se pudieron cargar tus pedidos. Inténtalo más tarde.</div>';
  }

  // Event delegation para botones de chat
  document.addEventListener('click', (ev) => {
    const chatBtn = ev.target.closest('.chatBtn');
    if (!chatBtn) return;
    
    const pedidoId = chatBtn.dataset.pedidoId;
    const destinatarioId = chatBtn.dataset.destinatarioId;
    
    if (window.chatManager && pedidoId && destinatarioId) {
      window.chatManager.openChatForPedido(pedidoId, destinatarioId);
    }
  });
});
