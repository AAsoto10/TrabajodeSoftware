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

  // Wire nav tabs
  const navLinks = document.querySelectorAll('.nav-pills .nav-link');
  if (navLinks && navLinks.length){
    navLinks[0].addEventListener('click', (ev)=>{ ev.preventDefault(); navLinks.forEach(n=>n.classList.remove('active')); navLinks[0].classList.add('active'); loadPendientes(); });
    if (navLinks[1]) navLinks[1].addEventListener('click', (ev)=>{ ev.preventDefault(); navLinks.forEach(n=>n.classList.remove('active')); navLinks[1].classList.add('active'); loadProfesionales(); });
    if (navLinks[2]) navLinks[2].addEventListener('click', (ev)=>{ ev.preventDefault(); navLinks.forEach(n=>n.classList.remove('active')); navLinks[2].classList.add('active'); loadClientes(); });
  }

  loadResumen();
  loadPendientes();
});
