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
        catch(err){ window.showError(err.message||'Error al procesar la solicitud', 'Error'); }
      }));
      document.querySelectorAll('.rejectBtn').forEach(b=>b.addEventListener('click', async ()=>{
        const id = b.dataset.id;
        window.showConfirm('¿Deseas rechazar este profesional?', async () => {
          try{ await window.apiRequest(`/admin/profesional/${id}/rechazar`, { method:'POST' }); loadPendientes(); loadResumen(); }
          catch(err){ window.showError(err.message||'Error al procesar la solicitud', 'Error'); }
        });
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
        window.showConfirm('¿Inhabilitar este profesional?', async () => {
          try{ await window.apiRequest(`/admin/user/${id}/disable`, { method: 'POST' }); loadProfesionales(); loadResumen(); }
          catch(err){ window.showError(err.message||'Error al procesar la solicitud', 'Error'); }
        });
      }));
      document.querySelectorAll('.enableBtn').forEach(b=>b.addEventListener('click', async (ev)=>{
        const id = ev.currentTarget.dataset.id;
        try{ await window.apiRequest(`/admin/user/${id}/enable`, { method: 'POST' }); loadProfesionales(); loadResumen(); }
        catch(err){ window.showError(err.message||'Error al procesar la solicitud', 'Error'); }
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
        window.showConfirm('¿Inhabilitar este cliente?', async () => {
          try{ await window.apiRequest(`/admin/user/${id}/disable`, { method: 'POST' }); loadClientes(); loadResumen(); }
          catch(err){ window.showError(err.message||'Error al procesar la solicitud', 'Error'); }
        });
      }));
      document.querySelectorAll('.enableUserBtn').forEach(b=>b.addEventListener('click', async (ev)=>{
        const id = ev.currentTarget.dataset.id;
        try{ await window.apiRequest(`/admin/user/${id}/enable`, { method: 'POST' }); loadClientes(); loadResumen(); }
        catch(err){ window.showError(err.message||'Error al procesar la solicitud', 'Error'); }
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
                    <div class="descripcion-container">
                      <p class="mb-0 text-dark descripcion-text" style="font-size: 0.9rem; line-height: 1.6;" data-full="${r.descripcion.replace(/"/g, '&quot;')}">
                        ${r.descripcion.length > 120 ? r.descripcion.substring(0, 120) + '...' : r.descripcion}
                      </p>
                      ${r.descripcion.length > 120 ? `
                        <button class="btn btn-link btn-sm p-0 mt-1 ver-mas-btn" style="font-size: 0.85rem; text-decoration: none;">
                          <i class="bi bi-chevron-down"></i> Ver más
                        </button>
                      ` : ''}
                    </div>
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
          .descripcion-text {
            transition: max-height 0.3s ease;
            overflow: hidden;
          }
          .ver-mas-btn {
            transition: all 0.2s ease;
          }
          .ver-mas-btn:hover {
            transform: translateX(3px);
          }
        </style>
      `;
      
      admin.innerHTML = html;
      
      // Agregar event listeners para los botones "Ver más"
      document.querySelectorAll('.ver-mas-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const container = btn.closest('.descripcion-container');
          const textElement = container.querySelector('.descripcion-text');
          const fullText = textElement.dataset.full;
          const isExpanded = btn.classList.contains('expanded');
          
          if (isExpanded) {
            // Colapsar
            textElement.textContent = fullText.substring(0, 120) + '...';
            btn.innerHTML = '<i class="bi bi-chevron-down"></i> Ver más';
            btn.classList.remove('expanded');
          } else {
            // Expandir
            textElement.textContent = fullText;
            btn.innerHTML = '<i class="bi bi-chevron-up"></i> Ver menos';
            btn.classList.add('expanded');
          }
        });
      });
    }catch(err){ 
      admin.innerHTML = '<div class="alert alert-danger">Error cargando reclamos</div>'; 
    }
  }

  async function loadDatabase(){
    try{
      const data = await window.apiRequest('/admin/database/tables');
      const tables = data.tables || [];
      
      let html = `
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h4><i class="bi bi-table"></i> Gestión de Base de Datos</h4>
        </div>
        <div class="alert alert-warning">
          <i class="bi bi-exclamation-triangle"></i> 
          <strong>Precaución:</strong> Eliminar o vaciar tablas puede causar pérdida de datos. Se recomienda hacer un backup antes.
        </div>
        <div class="row g-3">`;

      tables.forEach(table => {
        const tableIcons = {
          users: 'bi-people-fill',
          pedidos: 'bi-cart-fill',
          profiles: 'bi-person-badge',
          ratings: 'bi-star-fill',
          commissions: 'bi-cash-coin',
          reclamos: 'bi-exclamation-circle-fill'
        };
        
        const icon = tableIcons[table] || 'bi-table';
        
        html += `
          <div class="col-md-6 col-lg-4">
            <div class="card h-100">
              <div class="card-body">
                <h5 class="card-title">
                  <i class="bi ${icon}"></i> ${table}
                </h5>
                <div class="d-flex gap-2 mt-3">
                  <button class="btn btn-sm btn-primary viewTableBtn" data-table="${table}">
                    <i class="bi bi-eye"></i> Ver Datos
                  </button>
                  ${table !== 'users' ? `
                  <button class="btn btn-sm btn-danger truncateTableBtn" data-table="${table}">
                    <i class="bi bi-trash"></i> Vaciar
                  </button>
                  ` : '<span class="badge bg-secondary">Protegida</span>'}
                </div>
              </div>
            </div>
          </div>`;
      });

      html += '</div><div id="tableDataContainer" class="mt-4"></div>';
      admin.innerHTML = html;

      // Event listeners
      document.querySelectorAll('.viewTableBtn').forEach(btn => {
        btn.addEventListener('click', () => loadTableData(btn.dataset.table));
      });

      document.querySelectorAll('.truncateTableBtn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const table = btn.dataset.table;
          window.showConfirm(
            `Esto eliminará <strong>TODOS los registros</strong> de la tabla "<strong>${table}</strong>" y <strong>NO se puede deshacer</strong>.<br><br>¿Deseas continuar?`,
            async () => {
              try {
                await window.apiRequest(`/admin/database/table/${table}/truncate`, { method: 'POST' });
                window.showSuccess(`Tabla "${table}" vaciada correctamente`);
                setTimeout(() => loadDatabase(), 800);
              } catch (err) {
                window.showError(err.message || 'No se pudo vaciar la tabla');
              }
            },
            '⚠️ Confirmar Vaciado de Tabla'
          );
        });
      });

    }catch(err){ 
      admin.innerHTML = '<div class="alert alert-danger">Error cargando base de datos: ' + (err.message || '') + '</div>'; 
    }
  }

  async function loadTableData(tableName) {
    try {
      const container = document.getElementById('tableDataContainer');
      container.innerHTML = '<div class="text-center"><div class="spinner-border"></div><p>Cargando datos...</p></div>';
      
      const data = await window.apiRequest(`/admin/database/table/${tableName}`);
      
      let html = `
        <div class="card">
          <div class="card-header bg-primary text-white">
            <h5 class="mb-0">
              <i class="bi bi-table"></i> Tabla: ${tableName} 
              <span class="badge bg-light text-dark">${data.total} registros totales</span>
              ${data.rows.length < data.total ? `<small class="ms-2">(Mostrando últimos 100)</small>` : ''}
            </h5>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive" style="max-height: 500px; overflow-y: auto">
              <table class="table table-striped table-hover mb-0">
                <thead class="table-dark sticky-top">
                  <tr>
                    ${data.columns.map(col => `<th>${col.name}</th>`).join('')}
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>`;

      if (data.rows.length === 0) {
        html += `<tr><td colspan="${data.columns.length + 1}" class="text-center text-muted">No hay registros</td></tr>`;
      } else {
        data.rows.forEach(row => {
          html += '<tr>';
          data.columns.forEach(col => {
            let value = row[col.name];
            // Formatear valores
            if (value === null) value = '<span class="text-muted">NULL</span>';
            else if (typeof value === 'boolean') value = value ? '✓' : '✗';
            else if (col.name.includes('fecha') || col.name.includes('created')) {
              value = new Date(value).toLocaleString('es-ES');
            }
            else if (String(value).length > 50) value = String(value).substring(0, 50) + '...';
            
            html += `<td>${value}</td>`;
          });
          html += `
            <td>
              <button class="btn btn-sm btn-danger deleteRowBtn" 
                data-table="${tableName}" 
                data-id="${row.id}"
                ${tableName === 'users' && row.rol === 'admin' ? 'disabled title="No se puede eliminar admin"' : ''}>
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>`;
        });
      }

      html += `
                </tbody>
              </table>
            </div>
          </div>
        </div>`;

      container.innerHTML = html;

      // Event listeners para eliminar filas
      document.querySelectorAll('.deleteRowBtn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const table = btn.dataset.table;
          const id = btn.dataset.id;
          
          window.showConfirm(`¿Eliminar registro ID ${id} de la tabla "${table}"?`, async () => {
            try {
              await window.apiRequest(`/admin/database/table/${table}/row/${id}`, { method: 'DELETE' });
              window.showSuccess('Registro eliminado correctamente');
              setTimeout(() => loadTableData(table), 600);
            } catch (err) {
              window.showError(err.message || 'No se pudo eliminar el registro');
            }
          });
        });
      });

    } catch (err) {
      document.getElementById('tableDataContainer').innerHTML = 
        '<div class="alert alert-danger">Error cargando datos: ' + (err.message || '') + '</div>';
    }
  }

  async function loadBackups(){
    try{
      const data = await window.apiRequest('/admin/backups');
      const backups = data.backups || [];
      
      if (backups.length === 0){
        admin.innerHTML = `
          <div class="card p-4">
            <div class="text-center">
              <i class="bi bi-hdd-stack" style="font-size:3rem;color:#6c757d"></i>
              <h5 class="mt-3 text-muted">No hay backups disponibles</h5>
              <button class="btn btn-primary mt-3" id="createBackupBtn">
                <i class="bi bi-plus-circle"></i> Crear Primer Backup
              </button>
            </div>
          </div>`;
        document.getElementById('createBackupBtn').addEventListener('click', createBackup);
        return;
      }

      let html = `
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h4><i class="bi bi-hdd-stack"></i> Gestión de Backups</h4>
          <button class="btn btn-success" id="createBackupBtn">
            <i class="bi bi-plus-circle"></i> Crear Backup Ahora
          </button>
        </div>
        <div class="alert alert-info">
          <i class="bi bi-info-circle"></i> 
          Los backups se crean automáticamente cada 24 horas. Se mantienen los últimos 10 backups.
        </div>
        <div class="row g-3">`;

      backups.forEach((backup, index) => {
        const date = new Date(backup.modified);
        const dateStr = date.toLocaleString('es-ES');
        const isLatest = index === 0;
        
        html += `
          <div class="col-md-6 col-lg-4">
            <div class="card h-100">
              <div class="card-body">
                ${isLatest ? '<span class="badge bg-success mb-2">Más reciente</span>' : ''}
                <h6 class="card-title">
                  <i class="bi bi-file-earmark-zip"></i> 
                  Backup #${backups.length - index}
                </h6>
                <p class="card-text small text-muted mb-2">
                  <i class="bi bi-calendar3"></i> ${dateStr}<br>
                  <i class="bi bi-hdd"></i> ${backup.sizeMB} MB
                </p>
                <div class="d-flex gap-2">
                  <button class="btn btn-sm btn-outline-primary restoreBtn" 
                    data-filename="${backup.name}"
                    ${isLatest ? 'disabled title="Ya es el backup actual"' : ''}>
                    <i class="bi bi-arrow-counterclockwise"></i> Restaurar
                  </button>
                  <button class="btn btn-sm btn-outline-danger deleteBtn" 
                    data-filename="${backup.name}"
                    ${isLatest ? 'disabled title="No puedes eliminar el backup más reciente"' : ''}>
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>`;
      });

      html += '</div>';
      admin.innerHTML = html;

      // Event listeners
      document.getElementById('createBackupBtn').addEventListener('click', createBackup);
      
      document.querySelectorAll('.restoreBtn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const filename = btn.dataset.filename;
          window.showConfirm(
            `Esto <strong>sobrescribirá la base de datos actual</strong>.<br><br>Se recomienda crear un backup actual antes de restaurar.<br><br><strong>Archivo:</strong> ${filename}`,
            async () => {
              try {
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Restaurando...';
                await window.apiRequest('/admin/backups/restore', {
                  method: 'POST',
                  body: JSON.stringify({ backupFileName: filename })
                });
                window.showSuccess('Backup restaurado exitosamente.<br>La página se recargará automáticamente.', '¡Restauración Exitosa!');
                setTimeout(() => location.reload(), 2000);
              } catch (err) {
                window.showError(err.message || 'No se pudo restaurar el backup');
                loadBackups();
              }
            },
            '⚠️ ¿Restaurar Backup?'
          );
        });
      });

      document.querySelectorAll('.deleteBtn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const filename = btn.dataset.filename;
          window.showConfirm(`¿Eliminar backup: <strong>${filename}</strong>?`, async () => {
            try {
              await window.apiRequest(`/admin/backups/${filename}`, { method: 'DELETE' });
              window.showSuccess('Backup eliminado correctamente');
              setTimeout(() => loadBackups(), 600);
            } catch (err) {
              window.showError(err.message || 'No se pudo eliminar el backup');
            }
          });
        });
      });

    }catch(err){ 
      admin.innerHTML = '<div class="alert alert-danger">Error cargando backups: ' + (err.message || '') + '</div>'; 
    }
  }

  async function createBackup() {
    const btn = document.getElementById('createBackupBtn');
    if (!btn) return;
    
    try {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Creando backup...';
      await window.apiRequest('/admin/backups/create', { method: 'POST' });
      window.showSuccess('Backup creado exitosamente');
      setTimeout(() => loadBackups(), 600);
    } catch (err) {
      window.showError(err.message || 'No se pudo crear el backup');
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-plus-circle"></i> Crear Backup Ahora';
    }
  }

  // ==================== Categorías ====================
  async function loadCategorias(){
    try{
      const categorias = await window.apiRequest('/admin/categorias');
      if (!categorias || categorias.length === 0){ 
        admin.innerHTML = `
          <div class="card p-4">
            <div class="text-center text-muted mb-3">No hay categorías registradas</div>
            <button class="btn btn-primary" onclick="showCategoriaModal()">
              <i class="bi bi-plus-circle"></i> Agregar Categoría
            </button>
          </div>`; 
        return; 
      }
      
      let html = `
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h4>Gestión de Categorías de Servicios</h4>
          <button class="btn btn-primary" onclick="showCategoriaModal()">
            <i class="bi bi-plus-circle"></i> Agregar Categoría
          </button>
        </div>
        <div class="row g-3">`;
      
      categorias.forEach(cat => {
        const statusBadge = cat.activo ? 
          '<span class="badge bg-success">Activa</span>' : 
          '<span class="badge bg-secondary">Inactiva</span>';
        
        html += `
          <div class="col-lg-4 col-md-6">
            <div class="card h-100 shadow-sm">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <i class="bi ${cat.icono || 'bi-tools'}" style="font-size: 2rem; color: #00d4ff;"></i>
                  </div>
                  ${statusBadge}
                </div>
                <h5 class="card-title">${cat.nombre}</h5>
                <p class="card-text text-muted small">${cat.descripcion || 'Sin descripción'}</p>
                <div class="d-flex gap-2 mt-3">
                  <button class="btn btn-sm btn-outline-primary editCatBtn" data-id="${cat.id}">
                    <i class="bi bi-pencil"></i> Editar
                  </button>
                  ${cat.activo ? 
                    `<button class="btn btn-sm btn-outline-warning deactivateCatBtn" data-id="${cat.id}">
                      <i class="bi bi-x-circle"></i> Desactivar
                    </button>` :
                    `<button class="btn btn-sm btn-outline-success activateCatBtn" data-id="${cat.id}">
                      <i class="bi bi-check-circle"></i> Activar
                    </button>`
                  }
                  <button class="btn btn-sm btn-outline-danger deleteCatBtn" data-id="${cat.id}">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>`;
      });
      
      html += '</div>';
      admin.innerHTML = html;
      
      // Event listeners para botones
      document.querySelectorAll('.editCatBtn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          const cat = categorias.find(c => c.id == id);
          showCategoriaModal(cat);
        });
      });
      
      document.querySelectorAll('.deactivateCatBtn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          window.showConfirm('¿Desactivar esta categoría?', async () => {
            try{
              await window.apiRequest(`/admin/categorias/${id}/desactivar`, { method: 'POST' });
              loadCategorias();
            } catch(err){ window.showError(err.message || 'Error al desactivar', 'Error'); }
          });
        });
      });
      
      document.querySelectorAll('.activateCatBtn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          try{
            await window.apiRequest(`/admin/categorias/${id}/activar`, { method: 'POST' });
            loadCategorias();
          } catch(err){ window.showError(err.message || 'Error al activar', 'Error'); }
        });
      });
      
      document.querySelectorAll('.deleteCatBtn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          window.showConfirm('¿Eliminar permanentemente esta categoría? Esta acción no se puede deshacer.', async () => {
            try{
              await window.apiRequest(`/admin/categorias/${id}`, { method: 'DELETE' });
              loadCategorias();
            } catch(err){ window.showError(err.message || 'Error al eliminar', 'Error'); }
          });
        });
      });
      
    } catch(err){ 
      admin.innerHTML = '<div class="alert alert-danger">Error cargando categorías</div>'; 
    }
  }
  
  window.showCategoriaModal = function(categoria = null){
    const isEdit = !!categoria;
    const iconos = [
      'bi-lightning-charge', 'bi-droplet', 'bi-brush', 'bi-bricks', 'bi-hammer',
      'bi-wrench', 'bi-tools', 'bi-paint-bucket', 'bi-house-door', 'bi-tree',
      'bi-snow', 'bi-fire', 'bi-plug', 'bi-lightbulb', 'bi-wind'
    ];
    
    let iconosHtml = '';
    iconos.forEach(icono => {
      const selected = categoria && categoria.icono === icono ? 'active' : '';
      iconosHtml += `
        <div class="col-3 text-center">
          <button type="button" class="btn btn-outline-secondary icon-selector ${selected}" data-icon="${icono}">
            <i class="bi ${icono}" style="font-size: 1.5rem;"></i>
          </button>
        </div>`;
    });
    
    const modalHtml = `
      <div class="modal fade" id="categoriaModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">${isEdit ? 'Editar' : 'Agregar'} Categoría</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form id="categoriaForm">
                <div class="mb-3">
                  <label class="form-label">Nombre *</label>
                  <input type="text" class="form-control" id="catNombre" value="${categoria ? categoria.nombre : ''}" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Descripción</label>
                  <textarea class="form-control" id="catDescripcion" rows="3">${categoria ? categoria.descripcion || '' : ''}</textarea>
                </div>
                <div class="mb-3">
                  <label class="form-label">Icono *</label>
                  <input type="hidden" id="catIcono" value="${categoria ? categoria.icono : 'bi-tools'}">
                  <div class="row g-2" id="iconGrid">
                    ${iconosHtml}
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" class="btn btn-primary" id="saveCatBtn">${isEdit ? 'Guardar Cambios' : 'Crear Categoría'}</button>
            </div>
          </div>
        </div>
      </div>`;
    
    // Remover modal anterior si existe
    const oldModal = document.getElementById('categoriaModal');
    if (oldModal) oldModal.remove();
    
    // Insertar modal en el DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('categoriaModal'));
    
    // Seleccionar icono
    document.querySelectorAll('.icon-selector').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.icon-selector').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('catIcono').value = btn.dataset.icon;
      });
    });
    
    // Guardar
    document.getElementById('saveCatBtn').addEventListener('click', async () => {
      const nombre = document.getElementById('catNombre').value.trim();
      const descripcion = document.getElementById('catDescripcion').value.trim();
      const icono = document.getElementById('catIcono').value;
      
      if (!nombre) {
        window.showError('El nombre es requerido', 'Error');
        return;
      }
      
      try {
        const data = { nombre, descripcion, icono };
        if (isEdit) {
          await window.apiRequest(`/admin/categorias/${categoria.id}`, { 
            method: 'PUT', 
            body: JSON.stringify(data) 
          });
        } else {
          await window.apiRequest('/admin/categorias', { 
            method: 'POST', 
            body: JSON.stringify(data) 
          });
        }
        modal.hide();
        loadCategorias();
      } catch(err) {
        window.showError(err.message || 'Error al guardar', 'Error');
      }
    });
    
    modal.show();
  };

  // Wire nav tabs
  const navLinks = document.querySelectorAll('.nav-pills .nav-link');
  if (navLinks && navLinks.length){
    navLinks[0].addEventListener('click', (ev)=>{ ev.preventDefault(); navLinks.forEach(n=>n.classList.remove('active')); navLinks[0].classList.add('active'); loadPendientes(); });
    if (navLinks[1]) navLinks[1].addEventListener('click', (ev)=>{ ev.preventDefault(); navLinks.forEach(n=>n.classList.remove('active')); navLinks[1].classList.add('active'); loadProfesionales(); });
    if (navLinks[2]) navLinks[2].addEventListener('click', (ev)=>{ ev.preventDefault(); navLinks.forEach(n=>n.classList.remove('active')); navLinks[2].classList.add('active'); loadClientes(); });
    if (navLinks[3]) navLinks[3].addEventListener('click', (ev)=>{ ev.preventDefault(); navLinks.forEach(n=>n.classList.remove('active')); navLinks[3].classList.add('active'); loadCategorias(); });
    if (navLinks[4]) navLinks[4].addEventListener('click', (ev)=>{ ev.preventDefault(); navLinks.forEach(n=>n.classList.remove('active')); navLinks[4].classList.add('active'); loadReclamos(); });
    if (navLinks[5]) navLinks[5].addEventListener('click', (ev)=>{ ev.preventDefault(); navLinks.forEach(n=>n.classList.remove('active')); navLinks[5].classList.add('active'); loadDatabase(); });
    if (navLinks[6]) navLinks[6].addEventListener('click', (ev)=>{ ev.preventDefault(); navLinks.forEach(n=>n.classList.remove('active')); navLinks[6].classList.add('active'); loadBackups(); });
  }

  loadResumen();
  loadPendientes();
});
