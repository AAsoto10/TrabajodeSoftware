document.addEventListener('DOMContentLoaded', async ()=>{
  const pedidosEl = document.getElementById('pedidosList');
  const servicesGrid = document.getElementById('servicesGrid');
  const profileBtn = document.getElementById('profileBtn');
  const profileModal = new bootstrap.Modal(document.getElementById('profileModal'));
  const profileForm = document.getElementById('profileForm');
  const profileModalTitle = document.getElementById('profileModalTitle');
  const profileSaveBtn = document.getElementById('profileSaveBtn');

  const token = localStorage.getItem('token');
  if (!token) { window.location = 'login.html'; return; }

  // load current user basic info
  let user = null;
  try{
    user = await window.apiRequest('/auth/me');
  }catch(err){
    if (err && err.status === 401) { window.location = 'login.html'; return; }
    console.warn('No se pudo cargar usuario', err);
  }

  // manage editing state
  let currentEditingProfileId = null;

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
        if (!profile) return alert('Perfil no encontrado');
        currentEditingProfileId = profile.id;
        document.getElementById('p_categoria').value = profile.categoria || 'Electricidad';
        document.getElementById('p_tarifa').value = profile.tarifa || '';
        document.getElementById('p_zona').value = profile.zona || '';
        document.getElementById('p_bio').value = profile.biografia || '';
        document.getElementById('p_certs').value = profile.certificados || '';
        document.getElementById('p_avatar').value = profile.avatar || '';
        if (profileModalTitle) profileModalTitle.textContent = 'Editar perfil profesional';
        if (profileSaveBtn) profileSaveBtn.textContent = 'Guardar perfil';
        profileModal.show();
      }));

      document.querySelectorAll('.deleteProfileBtn').forEach(btn=>btn.addEventListener('click', async (ev)=>{
        const id = ev.currentTarget.dataset.id;
        if (!confirm('Eliminar perfil profesional?')) return;
        try{
          await window.apiRequest(`/profiles/${id}`, { method: 'DELETE' });
          alert('Perfil eliminado');
          fetchAndRenderProfiles();
        }catch(err){ alert(err.message || 'Error al eliminar'); }
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
    document.getElementById('p_categoria').value = 'Electricidad';
    document.getElementById('p_tarifa').value = '';
    document.getElementById('p_zona').value = '';
    document.getElementById('p_bio').value = '';
    document.getElementById('p_certs').value = '';
    document.getElementById('p_avatar').value = '';
    if (profileModalTitle) profileModalTitle.textContent = 'Insertar perfil profesional';
    if (profileSaveBtn) profileSaveBtn.textContent = 'Insertar perfil';
    profileModal.show();
  });

  profileForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const body = {
      categoria: document.getElementById('p_categoria').value,
      tarifa: Number(document.getElementById('p_tarifa').value)||0,
      zona: document.getElementById('p_zona').value,
      biografia: document.getElementById('p_bio').value,
      certificados: document.getElementById('p_certs').value,
      avatar: document.getElementById('p_avatar').value
    };
    try{
      if (currentEditingProfileId){
        await window.apiRequest(`/profiles/${currentEditingProfileId}`, { method: 'PUT', body: JSON.stringify(body) });
        alert('Perfil actualizado');
      }else{
        await window.apiRequest('/profiles', { method: 'POST', body: JSON.stringify(body) });
        alert('Perfil creado');
      }
      profileModal.hide();
      // refresh list
      await fetchAndRenderProfiles();
      window.dispatchEvent(new Event('profileUpdated'));
    }catch(err){
      alert(err.message||'Error guardando perfil');
    }
  });

  // 2) cargar pedidos asignados al profesional (sección separada)
  try{
    const pedidos = await window.apiRequest('/pedidos/profesional');
    // render stats and tabs
    async function renderStatsAndTabs(pedidosList){
      const pending = pedidosList.filter(p=>p.estado === 'pendiente').length;
      const assigned = pedidosList.filter(p=>p.estado === 'asignado').length;
      const completed = pedidosList.filter(p=>p.estado === 'completado').length;
      const saldo = user && typeof user.saldo !== 'undefined' ? user.saldo : 0;
      // fetch ratings for this professional
      let ratings = [];
      try{ ratings = await window.apiRequest(`/profesionales/${user.id}/calificaciones`); }catch(e){ console.warn('No se pudieron cargar calificaciones', e); }
      const ratingsCount = ratings ? ratings.length : 0;
      const ratingsAvg = ratingsCount ? (ratings.reduce((s,r)=>s + (r.rating||0),0) / ratingsCount) : 0;
      const statsHtml = `
        <div class="row g-3 mb-3">
          <div class="col-md-4">
            <div class="card p-3 text-center">
              <div class="small text-muted">Calificación Promedio</div>
              <div class="h3 text-primary">4.0</div>
              <div class="small text-muted">0 calificaciones</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card p-3 text-center">
              <div class="small text-muted">Solicitudes Pendientes</div>
              <div class="h3 text-warning">${pending}</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card p-3 text-center">
              <div class="small text-muted">Trabajos Activos</div>
              <div class="h3 text-info">${assigned}</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card p-3 text-center">
              <div class="small text-muted">Saldo disponible</div>
              <div class="h3 text-success">Bs. ${saldo.toFixed ? saldo.toFixed(2) : saldo}</div>
            </div>
          </div>
        </div>
        <ul class="nav nav-tabs mb-3" id="profTab" role="tablist">
          <li class="nav-item" role="presentation"><button class="nav-link active" data-bs-toggle="tab" data-bs-target="#tab-pendientes" type="button">Pendientes</button></li>
          <li class="nav-item" role="presentation"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-activos" type="button">Activos</button></li>
          <li class="nav-item" role="presentation"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-calificaciones" type="button">Calificaciones</button></li>
        </ul>
        <div class="tab-content">
          <div class="tab-pane fade show active" id="tab-pendientes"></div>
          <div class="tab-pane fade" id="tab-activos"></div>
          <div class="tab-pane fade" id="tab-calificaciones">
            ${ratingsCount === 0 ? 'No hay calificaciones aún' : '<div id="ratingsList"></div>'}
          </div>
        </div>`;
      document.getElementById('statsContainer').innerHTML = statsHtml;

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
          alert('Solicitud aceptada');
          // refresh pedidos list
          const newPedidos = await window.apiRequest('/pedidos/profesional');
          renderStatsAndTabs(newPedidos);
        }catch(err){ alert(err.message||'Error al aceptar'); }
      }));

      // attach reject handlers for pendientes
      tabPendientes.querySelectorAll('.rejectBtn').forEach(btn=>btn.addEventListener('click', async (ev)=>{
        const id = ev.currentTarget.dataset.id;
        if (!confirm('¿Rechazar esta solicitud?')) return;
        try{
          await window.apiRequest(`/pedidos/${id}/reject`, { method: 'POST' });
          alert('Solicitud rechazada');
          const newPedidos = await window.apiRequest('/pedidos/profesional');
          renderStatsAndTabs(newPedidos);
        }catch(err){ alert(err.message||'Error al rechazar'); }
      }));

      // attach ready handlers for activos (marcar pendiente de pago)
      tabActivos.querySelectorAll('.readyBtn').forEach(btn=>btn.addEventListener('click', async (ev)=>{
        const id = ev.currentTarget.dataset.id;
        try{ await window.apiRequest(`/pedidos/${id}/ready`, { method:'POST' }); alert('Pedido marcado pendiente de pago');
          const newPedidos = await window.apiRequest('/pedidos/profesional');
          renderStatsAndTabs(newPedidos);
        }
        catch(err){ alert(err.message||'Error al marcar listo para pago'); }
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
            card.innerHTML = `<div class="d-flex justify-content-between align-items-center"><div><strong>${r.rating} ★</strong> <div class="small text-muted">por ${cliente} ${fecha ? ' - '+fecha : ''}</div></div></div><div class="mt-2">${r.comentario || ''}</div>`;
            ratingsContainer.appendChild(card);
          });
        }
      }
    }

    renderStatsAndTabs(pedidos);
  }catch(err){
    pedidosEl.innerHTML = '<div class="alert alert-warning">No se pudieron cargar tus pedidos. Inténtalo más tarde.</div>';
  }
});
