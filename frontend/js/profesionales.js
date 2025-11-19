document.addEventListener('DOMContentLoaded', async ()=>{
  const params = new URLSearchParams(window.location.search);
  const categoria = params.get('categoria') || '';
  
  // Mostrar u ocultar filtros según si hay categoría específica
  const filtrosContainer = document.getElementById('filtrosContainer');
  if (categoria) {
    // Si viene de una categoría específica, ocultar filtros
    filtrosContainer.style.display = 'none';
    document.getElementById('title').textContent = `Profesionales - ${categoria}`;
  } else {
    // Si es la vista general, mostrar filtros
    filtrosContainer.style.display = 'block';
    document.getElementById('title').textContent = 'Todos los Profesionales';
  }
  
  const listEl = document.getElementById('list');
  
  async function cargarProfesionales() {
    const zona = document.getElementById('filtroZona')?.value.trim() || '';
    const tarifaMax = document.getElementById('filtroTarifaMax')?.value || '';
    const ratingMin = document.getElementById('filtroRating')?.value || '';
    
    const queryParams = new URLSearchParams();
    if (categoria) queryParams.append('categoria', categoria);
    // Solo aplicar filtros adicionales si NO hay categoría específica
    if (!categoria) {
      if (zona) queryParams.append('zona', zona);
      if (tarifaMax) queryParams.append('tarifaMax', tarifaMax);
      if (ratingMin) queryParams.append('ratingMin', ratingMin);
    }
    
    const queryString = queryParams.toString();
    const url = '/profiles' + (queryString ? '?' + queryString : '');
    
    try{
      const rows = await window.apiRequest(url);
      if (!rows || rows.length === 0) {
        listEl.innerHTML = '<div class="col-12"><div class="alert alert-info">No se encontraron profesionales' + (categoria ? ' en esta categoría' : ' con esos filtros') + '. <a href="#" id="resetLink">Ver todos</a></div></div>';
        document.getElementById('resetLink')?.addEventListener('click', (e)=>{
          e.preventDefault();
          if (!categoria) {
            document.getElementById('filtroZona').value = '';
            document.getElementById('filtroTarifaMax').value = '';
            document.getElementById('filtroRating').value = '';
          }
          window.location.href = 'profesionales.html';
        });
        return;
      }
      listEl.innerHTML = '';
      rows.forEach(p=>{
        const col = document.createElement('div'); 
        col.className='col-md-6 col-lg-4';
        const avatar = p.avatar ? (''+p.avatar).replace(/\s+/g,'') : 'https://via.placeholder.com/80';
        const bio = p.biografia ? (p.biografia.length>120 ? p.biografia.substring(0,120)+'...' : p.biografia) : '';
        const rating = parseFloat(p.rating_promedio) || 0;
        const totalRatings = p.total_ratings || 0;
        const stars = generarEstrellas(rating);
        
        col.innerHTML = `
          <div class="card professional-card p-4 h-100">
            <div class="d-flex gap-3 align-items-start mb-3">
              <div class="professional-avatar">
                <img src="${avatar}" width="80" height="80" style="border-radius:12px;object-fit:cover" onerror="this.onerror=null;this.src='https://via.placeholder.com/80'" />
              </div>
              <div class="flex-fill">
                <h5 class="mb-1 fw-bold">${p.usuario_nombre || p.nombre || 'Profesional'}</h5>
                <div class="badge bg-primary mb-2">${p.categoria || '-'}</div>
                <div class="mt-2 text-warning">
                  ${stars} <small class="text-muted fw-semibold">(${totalRatings})</small>
                </div>
              </div>
            </div>
            <div class="professional-location mb-2">
              <i class="bi bi-geo-alt-fill text-primary"></i> 
              <span class="text-muted">${p.zona || 'Sin especificar'}</span>
            </div>
            <p class="professional-bio text-muted">${bio}</p>
            <hr class="my-3" />
            <div class="d-flex justify-content-between align-items-center">
              <div class="professional-price">
                <div class="h4 mb-0 text-primary fw-bold">Bs. ${p.tarifa || 0}</div>
                <div class="small text-muted">por hora</div>
              </div>
              <div class="d-flex gap-2 flex-wrap">
                ${totalRatings > 0 ? `<button class="btn btn-outline-warning btn-sm verCalificacionesBtn" 
                  data-user-id="${p.usuario_id}" 
                  data-nombre="${p.usuario_nombre}"
                  data-categoria="${p.categoria}">
                  <i class="bi bi-star-fill"></i> Ver reseñas
                </button>` : ''}
                <button class="btn btn-info solicitarBtn" 
                  data-profile-id="${p.id}" 
                  data-user-id="${p.usuario_id}" 
                  data-nombre="${p.usuario_nombre}"
                  data-categoria="${p.categoria}"
                  data-tarifa="${p.tarifa}">
                  Solicitar
                </button>
              </div>
            </div>
          </div>`;
        listEl.appendChild(col);
      });

      const solicitarModal = new bootstrap.Modal(document.getElementById('solicitarModal'));
      const calificacionesModal = new bootstrap.Modal(document.getElementById('calificacionesModal'));
      
      // Event listener para botones de ver calificaciones
      document.querySelectorAll('.verCalificacionesBtn').forEach(btn=>{
        btn.addEventListener('click', async ()=>{
          const userId = btn.dataset.userId;
          const nombre = btn.dataset.nombre;
          const profCategoria = btn.dataset.categoria;
          
          document.getElementById('calificacionesNombre').textContent = nombre;
          document.getElementById('calificacionesCategoria').textContent = profCategoria;
          
          const calificacionesList = document.getElementById('calificacionesList');
          calificacionesList.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div></div>';
          
          calificacionesModal.show();
          
          try {
            // Cargar calificaciones de esta categoría específica
            const ratings = await window.apiRequest(`/profesionales/${userId}/calificaciones?categoria=${encodeURIComponent(profCategoria)}`);
            
            if (!ratings || ratings.length === 0) {
              calificacionesList.innerHTML = '<div class="alert alert-info">No hay calificaciones aún para este servicio.</div>';
              return;
            }
            
            calificacionesList.innerHTML = '';
            ratings.forEach(r => {
              const fecha = r.created_at ? new Date(r.created_at).toLocaleDateString('es-ES') : '';
              const estrellas = generarEstrellas(r.rating || 0);
              
              const card = document.createElement('div');
              card.className = 'card mb-3 p-3';
              card.innerHTML = `
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <div class="text-warning h5 mb-0">${estrellas}</div>
                    <small class="text-muted">${fecha}</small>
                  </div>
                  <span class="badge bg-secondary">${r.categoria || profCategoria}</span>
                </div>
                ${r.comentario ? `<p class="mb-0">${r.comentario}</p>` : '<p class="text-muted mb-0"><em>Sin comentario</em></p>'}
              `;
              calificacionesList.appendChild(card);
            });
          } catch(err) {
            calificacionesList.innerHTML = '<div class="alert alert-danger">Error al cargar calificaciones.</div>';
            console.error(err);
          }
        });
      });
      
      document.querySelectorAll('.solicitarBtn').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const userId = btn.dataset.userId;
          const nombre = btn.dataset.nombre;
          const profCategoria = btn.dataset.categoria || '';
          const tarifa = btn.dataset.tarifa || '';
          const profIdEl = document.getElementById('profesionalId');
          if (profIdEl) profIdEl.value = userId;
          const modalCat = document.getElementById('modalCategoria');
          if (modalCat) modalCat.value = profCategoria;
          const descEl = document.getElementById('desc');
          if (descEl) descEl.value = `Servicio solicitado a ${nombre}`;
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
        const token = sessionStorage.getItem('token');
        if (!token) { window.location = 'login.html'; return; }
        if (!descripcion){ window.showError('Por favor, describe el problema', 'Descripción requerida'); return; }
        try{
          const payload = { categoria: usedCategoria, descripcion, precio, profesionalId };
          if (fechaHora) payload.fechaHora = fechaHora;
          if (direccion) payload.direccion = direccion;
          await window.apiRequest('/pedidos', { method:'POST', body: JSON.stringify(payload)});
          window.showSuccess('Solicitud enviada correctamente<br>Serás redirigido a tu panel...', '¡Solicitud Enviada!');
          solicitarModal.hide();
          setTimeout(() => {
            window.location = 'panel-cliente.html';
          }, 1500);
        }catch(err){ window.showError(err.message||'Error al enviar la solicitud', 'Error'); }
      });

    }catch(err){ 
      listEl.innerHTML = '<div class="col-12"><div class="alert alert-danger">Error al cargar profesionales. Intenta nuevamente.</div></div>'; 
      console.error(err);
    }
  }
  
  function generarEstrellas(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    let html = '';
    for (let i = 0; i < fullStars; i++) html += '★';
    if (halfStar) html += '☆';
    for (let i = 0; i < emptyStars; i++) html += '☆';
    return html;
  }
  
  // Event listeners para filtros (solo si no hay categoría)
  if (!categoria) {
    document.getElementById('btnAplicarFiltros')?.addEventListener('click', cargarProfesionales);
    document.getElementById('btnLimpiarFiltros')?.addEventListener('click', ()=>{
      document.getElementById('filtroZona').value = '';
      document.getElementById('filtroTarifaMax').value = '';
      document.getElementById('filtroRating').value = '';
      cargarProfesionales();
    });
  }
  
  // Cargar profesionales automáticamente al inicio
  await cargarProfesionales();
});
