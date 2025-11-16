document.addEventListener('DOMContentLoaded', async ()=>{
  const params = new URLSearchParams(window.location.search);
  const categoria = params.get('categoria') || '';
  document.getElementById('title').textContent = categoria ? `Profesionales - ${categoria}` : 'Profesionales';
  const listEl = document.getElementById('list');
  try{
    const rows = await window.apiRequest('/profiles' + (categoria ? '?categoria='+encodeURIComponent(categoria) : ''));
    if (!rows || rows.length === 0) {
      listEl.innerHTML = '<div class="alert alert-info">No se encontraron profesionales.</div>';
      return;
    }
    listEl.innerHTML = '';
    rows.forEach(p=>{
      const col = document.createElement('div'); col.className='col-md-6 col-lg-4';
      const avatar = p.avatar ? (''+p.avatar).replace(/\s+/g,'') : 'https://via.placeholder.com/80';
      const bio = p.biografia ? (p.biografia.length>120 ? p.biografia.substring(0,120)+'...' : p.biografia) : '';
      col.innerHTML = `
        <div class="card p-4 h-100" style="border-radius:.8rem; box-shadow:0 10px 30px rgba(16,24,40,0.06)">
          <div class="d-flex gap-3 align-items-start">
            <img src="${avatar}" width="64" height="64" style="border-radius:8px;object-fit:cover" onerror="this.onerror=null;this.src='https://via.placeholder.com/80'" />
            <div class="flex-fill">
              <h5 class="mb-1">${p.usuario_nombre || p.nombre || 'Profesional'}</h5>
              <div class="small text-muted">${p.categoria || '-'}</div>
              <div class="mt-2 text-primary"><!-- rating placeholder -->
                <span class="me-2">★★★★★</span> <small class="text-muted">(0)</small>
              </div>
            </div>
          </div>
          <div class="mt-3 small text-muted">${p.zona || ''}${p.zona && p.zona2 ? ', '+p.zona2 : ''}</div>
          <p class="mt-2 text-muted small">${bio}</p>
          <hr />
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <div class="h5 mb-0">Bs. ${p.tarifa || 0}</div>
              <div class="small text-muted">por hora</div>
            </div>
            <div>
              <button class="btn btn-info solicitarBtn" 
                data-profile-id="${p.id}" 
                data-user-id="${p.usuario_id}" 
                data-nombre="${p.usuario_nombre}"
                data-categoria="${p.categoria}"
                data-tarifa="${p.tarifa}">
                Solicitar: ${p.categoria || 'Servicio'}
              </button>
            </div>
          </div>
        </div>`;
      listEl.appendChild(col);
    });

    // solicitar modal
    const solicitarModal = new bootstrap.Modal(document.getElementById('solicitarModal'));
    document.querySelectorAll('.solicitarBtn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const profileId = btn.dataset.profileId;
        const userId = btn.dataset.userId;
        const nombre = btn.dataset.nombre;
        const profCategoria = btn.dataset.categoria || '';
        const tarifa = btn.dataset.tarifa || '';
        // store the professional's user id (owner of the profile) - do defensive DOM checks
        const profIdEl = document.getElementById('profesionalId');
        if (profIdEl) {
          profIdEl.value = userId;
        } else {
          console.warn('profesionalId input not found in DOM');
        }
        // store category of the profile so the pedido has correct categoria
        const modalCat = document.getElementById('modalCategoria');
        if (modalCat) modalCat.value = profCategoria;
        else console.warn('modalCategoria input not found in DOM');
        // prefill description and price (defensive)
        const descEl = document.getElementById('desc');
        if (descEl) descEl.value = `Servicio solicitado a ${nombre}`;
        else console.warn('desc textarea not found in DOM');
        const precioEl = document.getElementById('precio');
        if (tarifa && precioEl) precioEl.value = tarifa;
        solicitarModal.show();
      });
    });

    document.getElementById('solicitarForm').addEventListener('submit', async (e)=>{
      e.preventDefault();
      const profesionalId = document.getElementById('profesionalId').value;
      const descripcion = document.getElementById('desc').value.trim();
      const precioEl = document.getElementById('precio');
      const precio = precioEl ? Number(precioEl.value) : 0;
      const fechaHora = document.getElementById('fechaHora').value || null;
      const direccion = document.getElementById('direccion').value.trim() || null;
      const modalCatEl = document.getElementById('modalCategoria');
      const usedCategoria = modalCatEl && modalCatEl.value ? modalCatEl.value : categoria;
      // require auth token
      const token = localStorage.getItem('token');
      if (!token) { window.location = 'login.html'; return; }
      if (!descripcion){ alert('Describe el problema.'); return; }
      try{
        const payload = { categoria: usedCategoria, descripcion, precio, profesionalId };
        if (fechaHora) payload.fechaHora = fechaHora;
        if (direccion) payload.direccion = direccion;
        const res = await window.apiRequest('/pedidos', { method:'POST', body: JSON.stringify(payload)});
        alert('Solicitud enviada correctamente');
        solicitarModal.hide();
        window.location = 'panel-cliente.html';
      }catch(err){ alert(err.message||'Error al solicitar'); }
    });

  }catch(err){ listEl.innerHTML = '<div class="alert alert-danger">Error al cargar profesionales</div>'; }
});
