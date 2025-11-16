document.addEventListener('DOMContentLoaded', ()=>{
  const admin = document.getElementById('adminContent');
  if (!admin) return;

  async function loadResumen(){
    try{
      const r = await window.apiRequest('/admin/resumen');
      document.getElementById('statTotal').textContent = r.total;
      document.getElementById('statProf').textContent = r.profesionales;
      document.getElementById('statSolic').textContent = r.solicitudes;
      document.getElementById('statPend').textContent = r.pendientes;
      if (document.getElementById('statCommissions')) document.getElementById('statCommissions').textContent = (r.commissions_total || 0).toFixed ? (r.commissions_total.toFixed(2)) : r.commissions_total;
    }catch(e){ /* ignore */ }
  }

  async function loadPendientes(){
    try{
      const pendientes = await window.apiRequest('/admin/profesionales/pendientes');
      if (!pendientes || pendientes.length===0){ admin.innerHTML = '<div class="card p-4"><div class="text-center text-muted">No hay profesionales pendientes</div></div>'; return; }
      let html = '';
      pendientes.forEach(p=>{
        html += `
          <div class="card p-3 mb-3">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h5 class="mb-1">${p.nombre}</h5>
                <div class="small text-muted">${p.email}</div>
                <div class="small text-muted">${p.categoria || ''}</div>
              </div>
              <div class="d-flex gap-2">
                <button class="btn btn-success btn-sm approveBtn" data-id="${p.id}">Validar</button>
                <button class="btn btn-danger btn-sm rejectBtn" data-id="${p.id}">Rechazar</button>
              </div>
            </div>
          </div>`;
      });
      admin.innerHTML = html;
      document.querySelectorAll('.approveBtn').forEach(b=>b.addEventListener('click', async ()=>{
        const id = b.dataset.id;
        try{ await window.apiRequest(`/admin/profesional/${id}/aprobar`, { method:'POST' }); loadPendientes(); loadResumen(); }
        catch(err){ alert(err.message||'Error'); }
      }));
      document.querySelectorAll('.rejectBtn').forEach(b=>b.addEventListener('click', async ()=>{
        const id = b.dataset.id;
        if (!confirm('¿Deseas rechazar este profesional?')) return;
        try{ await window.apiRequest(`/admin/profesional/${id}/rechazar`, { method:'POST' }); loadPendientes(); loadResumen(); }
        catch(err){ alert(err.message||'Error'); }
      }));
    }catch(err){ admin.innerHTML = '<div class="alert alert-danger">Error cargando pendientes</div>'; }
  }

  async function loadProfesionales(){
    try{
      const pros = await window.apiRequest('/admin/profesionales');
      if (!pros || pros.length === 0){ admin.innerHTML = '<div class="card p-4"><div class="text-center text-muted">No hay profesionales aprobados</div></div>'; return; }
      let html = '<div class="list-group">';
      pros.forEach(p=>{
        html += `
          <div class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <strong>${p.nombre}</strong> <div class="small text-muted">${p.email}</div>
              <div class="small text-muted">${p.categoria || ''}</div>
            </div>
            <div class="text-end">
              <div class="small text-muted">Saldo: Bs. ${p.saldo ? Number(p.saldo).toFixed(2) : '0.00'}</div>
              ${p.activo ? `<button class="btn btn-sm btn-warning disableBtn" data-id="${p.id}">Inhabilitar</button>` : `<button class="btn btn-sm btn-success enableBtn" data-id="${p.id}">Habilitar</button>`}
            </div>
          </div>`;
      });
      html += '</div>';
      admin.innerHTML = html;
      document.querySelectorAll('.disableBtn').forEach(b=>b.addEventListener('click', async (ev)=>{
        const id = ev.currentTarget.dataset.id;
        if (!confirm('Inhabilitar este profesional?')) return;
        try{ await window.apiRequest(`/admin/user/${id}/disable`, { method: 'POST' }); loadProfesionales(); loadResumen(); }
        catch(err){ alert(err.message||'Error'); }
      }));
      document.querySelectorAll('.enableBtn').forEach(b=>b.addEventListener('click', async (ev)=>{
        const id = ev.currentTarget.dataset.id;
        try{ await window.apiRequest(`/admin/user/${id}/enable`, { method: 'POST' }); loadProfesionales(); loadResumen(); }
        catch(err){ alert(err.message||'Error'); }
      }));
    }catch(err){ admin.innerHTML = '<div class="alert alert-danger">Error cargando profesionales</div>'; }
  }

  async function loadClientes(){
    try{
      const clients = await window.apiRequest('/admin/clientes');
      if (!clients || clients.length === 0){ admin.innerHTML = '<div class="card p-4"><div class="text-center text-muted">No hay clientes</div></div>'; return; }
      let html = '<div class="list-group">';
      clients.forEach(c=>{
        html += `
          <div class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <strong>${c.nombre}</strong>
              <div class="small text-muted">${c.email}</div>
            </div>
            <div>
              ${c.activo ? `<button class="btn btn-sm btn-warning disableUserBtn" data-id="${c.id}">Inhabilitar</button>` : `<button class="btn btn-sm btn-success enableUserBtn" data-id="${c.id}">Habilitar</button>`}
            </div>
          </div>`;
      });
      html += '</div>';
      admin.innerHTML = html;
      document.querySelectorAll('.disableUserBtn').forEach(b=>b.addEventListener('click', async (ev)=>{
        const id = ev.currentTarget.dataset.id;
        if (!confirm('Inhabilitar este cliente?')) return;
        try{ await window.apiRequest(`/admin/user/${id}/disable`, { method: 'POST' }); loadClientes(); loadResumen(); }
        catch(err){ alert(err.message||'Error'); }
      }));
      document.querySelectorAll('.enableUserBtn').forEach(b=>b.addEventListener('click', async (ev)=>{
        const id = ev.currentTarget.dataset.id;
        try{ await window.apiRequest(`/admin/user/${id}/enable`, { method: 'POST' }); loadClientes(); loadResumen(); }
        catch(err){ alert(err.message||'Error'); }
      }));
    }catch(err){ admin.innerHTML = '<div class="alert alert-danger">Error cargando clientes</div>'; }
  }

  async function loadReclamos(){
    try{
      const reclamos = await window.apiRequest('/reclamos/todos');
      if (!reclamos || reclamos.length === 0){ 
        admin.innerHTML = `
          <div class="text-center py-5">
            <div class="mb-4">
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="60" cy="60" r="50" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2"/>
                <path d="M45 50L55 60L45 70M65 50L75 60L65 70" stroke="#adb5bd" stroke-width="3" stroke-linecap="round"/>
              </svg>
            </div>
            <h4 class="fw-bold text-muted">No hay reclamos registrados</h4>
            <p class="text-muted">Los reclamos de los clientes aparecerán aquí cuando sean creados</p>
          </div>
        `; 
        return; 
      }
      
      let html = '<div class="row g-4">';
      reclamos.forEach(r=>{
        const estadoConfig = {
          'pendiente': { color: '#ffc107', bg: '#fff8e1', icon: 'exclamation-triangle-fill', text: 'Pendiente' },
          'en_revision': { color: '#0dcaf0', bg: '#e7f6fd', icon: 'hourglass-split', text: 'En Revisión' },
          'resuelto': { color: '#198754', bg: '#d1e7dd', icon: 'check-circle-fill', text: 'Atendido' }
        }[r.estado] || { color: '#6c757d', bg: '#e9ecef', icon: 'question-circle', text: r.estado };
        
        const motivoConfig = {
          'no_llego': { icon: '🚫', title: 'Profesional no llegó', color: '#dc3545' },
          'llego_tarde': { icon: '⏰', title: 'Profesional llegó tarde', color: '#fd7e14' },
          'mal_servicio': { icon: '😔', title: 'Servicio deficiente', color: '#dc3545' },
          'daños': { icon: '🔧', title: 'Daños ocasionados', color: '#dc3545' },
          'otro': { icon: '💬', title: 'Otro problema', color: '#6c757d' }
        }[r.motivo] || { icon: '💬', title: r.motivo, color: '#6c757d' };
        
        const fecha = new Date(r.created_at);
        const fechaFormateada = fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
        const horaFormateada = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        
        html += `
          <div class="col-12 col-lg-6 col-xl-4">
            <div class="card h-100 shadow-sm border-0 overflow-hidden" style="transition: all 0.3s ease; border-radius: 16px;">
              <div style="height: 6px; background: linear-gradient(90deg, ${estadoConfig.color} 0%, ${estadoConfig.color}88 100%);"></div>
              
              <div class="card-body p-4">
                <!-- Header con motivo -->
                <div class="mb-3">
                  <div>
                    <div class="d-flex align-items-center gap-2 mb-1">
                      <span style="font-size: 1.5rem;">${motivoConfig.icon}</span>
                      <h6 class="mb-0 fw-bold" style="color: ${motivoConfig.color}; font-size: 0.95rem;">
                        Reclamo de ${r.cliente_nombre}
                      </h6>
                    </div>
                    <div class="ms-5">
                      <small class="text-muted fw-semibold">${motivoConfig.title}</small>
                    </div>
                    <small class="text-muted d-flex align-items-center gap-1 mt-2 ms-5">
                      <i class="bi bi-calendar3"></i>
                      ${fechaFormateada} • ${horaFormateada}
                    </small>
                  </div>
                </div>
                
                <!-- Información de personas -->
                <div class="mb-3">
                  <div class="d-flex align-items-center gap-3 p-3 rounded-3" style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);">
                    <div class="flex-fill">
                      <div class="d-flex align-items-center gap-2 mb-2">
                        <div class="rounded-circle d-flex align-items-center justify-content-center" style="width: 36px; height: 36px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                          <i class="bi bi-person-fill text-white"></i>
                        </div>
                        <div>
                          <small class="text-muted d-block" style="font-size: 0.7rem; font-weight: 500;">CLIENTE</small>
                          <strong style="font-size: 0.95rem; color: #2c3e50;">${r.cliente_nombre}</strong>
                        </div>
                      </div>
                      <div class="d-flex align-items-center gap-2">
                        <div class="rounded-circle d-flex align-items-center justify-content-center" style="width: 36px; height: 36px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                          <i class="bi bi-tools text-white"></i>
                        </div>
                        <div>
                          <small class="text-muted d-block" style="font-size: 0.7rem; font-weight: 500;">PROFESIONAL</small>
                          <strong style="font-size: 0.95rem; color: #2c3e50;">${r.profesional_nombre || 'Sin asignar'}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Descripción -->
                <div class="mb-3">
                  <div class="p-3 rounded-3" style="background-color: #f8f9fa; border-left: 3px solid ${motivoConfig.color};">
                    <small class="text-muted d-block mb-2" style="font-weight: 600; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.5px;">
                      <i class="bi bi-chat-left-text me-1"></i>Descripción del reclamo
                    </small>
                    <p class="mb-0 text-dark" style="font-size: 0.9rem; line-height: 1.6;">
                      ${r.descripcion.length > 120 ? r.descripcion.substring(0, 120) + '...' : r.descripcion}
                    </p>
                  </div>
                </div>
                
                ${r.respuesta_admin ? `
                  <div class="p-3 rounded-3" style="background: linear-gradient(135deg, #e0f7fa 0%, #e1bee7 100%); border-left: 3px solid ${estadoConfig.color};">
                    <small class="d-flex align-items-center gap-1 mb-2" style="font-weight: 600; color: #00796b;">
                      <i class="bi bi-reply-fill"></i>
                      Respuesta del Administrador
                    </small>
                    <p class="mb-0" style="font-size: 0.85rem; color: #004d40; line-height: 1.5;">
                      ${r.respuesta_admin.length > 100 ? r.respuesta_admin.substring(0, 100) + '...' : r.respuesta_admin}
                    </p>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        `;
      });
      html += '</div>';
      
      // Agregar estilos hover
      html += `
        <style>
          .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 24px rgba(0,0,0,0.15) !important;
          }
        </style>
      `;
      
      admin.innerHTML = html;
    }catch(err){ 
      admin.innerHTML = '<div class="alert alert-danger">Error cargando reclamos</div>'; 
    }
  }

  // Wire nav tabs
  const navLinks = document.querySelectorAll('.nav-pills .nav-link');
  if (navLinks && navLinks.length){
    navLinks[0].addEventListener('click', (ev)=>{ ev.preventDefault(); navLinks.forEach(n=>n.classList.remove('active')); navLinks[0].classList.add('active'); loadPendientes(); });
    if (navLinks[1]) navLinks[1].addEventListener('click', (ev)=>{ ev.preventDefault(); navLinks.forEach(n=>n.classList.remove('active')); navLinks[1].classList.add('active'); loadProfesionales(); });
    if (navLinks[2]) navLinks[2].addEventListener('click', (ev)=>{ ev.preventDefault(); navLinks.forEach(n=>n.classList.remove('active')); navLinks[2].classList.add('active'); loadClientes(); });
    if (navLinks[4]) navLinks[4].addEventListener('click', (ev)=>{ ev.preventDefault(); navLinks.forEach(n=>n.classList.remove('active')); navLinks[4].classList.add('active'); loadReclamos(); });
  }

  loadResumen();
  loadPendientes();
});
