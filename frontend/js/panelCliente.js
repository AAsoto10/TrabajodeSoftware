document.addEventListener('DOMContentLoaded', ()=>{
  const pedidoForm = document.getElementById('pedidoForm');
  const pagoModalEl = document.getElementById('pagoModal');
  const pagoModal = new bootstrap.Modal(pagoModalEl);
  const pedidosContainer = document.getElementById('misPedidosContainer');
  const pedidoCard = document.getElementById('pedidoCard');

  async function loadPedidos(){
    const token = sessionStorage.getItem('token');
    if (!token){ pedidosContainer.innerHTML = '<div class="card panel-empty"><div class="text-center"><a href="login.html" class="btn btn-primary">Iniciar sesión para ver tus pedidos</a></div></div>'; return; }
    try{
      const pedidos = await window.apiRequest('/pedidos/cliente');
      if (!pedidos || pedidos.length===0){
        pedidosContainer.innerHTML = '<div class="card panel-empty"><div class="text-center text-muted"><p>No tienes solicitudes aún</p><a id="crearPrimera" class="btn btn-info text-white rounded-pill">Crear primera solicitud</a></div></div>';
        document.getElementById('crearPrimera').addEventListener('click', ()=>{ openPedidoForm(); });
      } else {
        // Render pedidos en un grid responsivo de 3 columnas
        let html = '<h5 class="mb-4">Mis pedidos</h5><div class="pedido-grid row g-4">';
        pedidos.forEach(p=>{
          const profesionalText = p.profesional_nombre ? `Profesional: ${p.profesional_nombre}` : (p.profesional_id ? `Profesional: ${p.profesional_id}` : 'Profesional: Sin asignar');
          const created = p.created_at ? `<div class="small text-muted"><i class="bi bi-calendar-event"></i> ${formatDate(p.created_at)}</div>` : '';
          
          // Mostrar botón de reclamo solo si el pedido está asignado o completado y tiene profesional
          const puedeReclamar = p.profesional_id && (p.estado === 'asignado' || p.estado === 'completado' || p.estado === 'pendiente_pago');
          
          html += `
            <div class="col-12 col-md-6 col-lg-4">
              <div class="card pedido-card h-100 p-3">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 class="mb-1">${p.categoria || 'Servicio'}</h6>
                    <div class="small text-muted">${p.descripcion || ''}</div>
                  </div>
                  <div><span class="pedido-estado">${p.estado}</span></div>
                </div>
                <div class="mt-3 pedido-meta">
                  ${p.direccion ? '<div><i class="bi bi-geo-alt-fill"></i> '+p.direccion+'</div>' : ''}
                  ${created}
                  <div><i class="bi bi-person-fill"></i> ${profesionalText}</div>
                  ${p.profesional_id ? `<div class="mt-2"><button class="btn btn-sm btn-outline-info chatBtn" data-pedido-id="${p.id}" data-destinatario-id="${p.profesional_id}"><i class="bi bi-chat-dots"></i> Enviar mensaje</button></div>` : ''}
                  ${p.estado === 'pendiente_pago' ? `<div class="mt-3"><button class="btn btn-sm btn-aqua payBtn" data-id="${p.id}" data-price="${p.precio || 0}">Pagar (simulado)</button></div>` : ''}
                  ${p.estado === 'completado' ? `<div class="mt-3"><button class="btn btn-sm btn-outline-primary calificarBtn" data-id="${p.id}">Calificar</button></div>` : ''}
                  ${puedeReclamar ? `<div class="mt-2"><button class="btn btn-sm btn-outline-danger reclamarBtn" data-pedido-id="${p.id}" data-profesional="${p.profesional_nombre || 'Profesional'}"><i class="bi bi-exclamation-triangle"></i> Reclamar</button></div>` : ''}
                </div>
              </div>
            </div>`;
        });
        html += '</div>';
        pedidosContainer.innerHTML = html;
      }
    }catch(e){ 
      // En caso de error en el servidor, mostramos la CTA para crear la primera solicitud
      pedidosContainer.innerHTML = '<div class="card panel-empty"><div class="text-center text-muted"><p>No tienes solicitudes aún</p><a id="crearPrimera" class="btn btn-info text-white rounded-pill">Crear primera solicitud</a></div></div>';
      const crearBtn = document.getElementById('crearPrimera');
      if (crearBtn) crearBtn.addEventListener('click', ()=>{ openPedidoForm(); });
      console.error('Error cargando pedidos en frontend:', e);
    }
  }

  function pad(n){ return n<10 ? '0'+n : ''+n }
  function formatDate(d){
    // accept sqlite timestamp string or ISO; try to parse
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    const dd = pad(dt.getDate());
    const mm = pad(dt.getMonth()+1);
    const yyyy = dt.getFullYear();
    const hh = pad(dt.getHours());
    const min = pad(dt.getMinutes());
    return `${dd}/${mm}/${yyyy}, ${hh}:${min}`;
  }

  loadPedidos();

  // Nueva solicitud button: mostrar formulario y scrollear
  const nuevaBtn = document.getElementById('nuevaSolicitudBtn');
  function openPedidoForm(){
    // Redirigir a la página de servicios/profesionales
    window.location.href = 'profesionales.html';
  }
  if (nuevaBtn) nuevaBtn.addEventListener('click', openPedidoForm);

  if (pedidoForm){
    pedidoForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const categoria = document.getElementById('categoria').value;
      const descripcion = document.getElementById('descripcion').value;
      const precio = Number(document.getElementById('precio').value);
      try{
        await window.apiRequest('/pedidos',{method:'POST', body: JSON.stringify({categoria, descripcion, precio})});
        window.showSuccess('Pedido creado correctamente.<br>Espera a que el profesional marque listo para pago.', '¡Solicitud Enviada!');
        document.getElementById('descripcion').value = '';
        document.getElementById('precio').value = '';
        setTimeout(() => loadPedidos(), 800);
      }catch(err){ window.showError(err.message||'Error al crear pedido', 'Error'); }
    });
  }

  // handler para pagar (mostrar QR del profesional)
  pedidosContainer.addEventListener('click', async (ev)=>{
    const btn = ev.target.closest && ev.target.closest('.payBtn');
    if (!btn) return;
    const id = btn.dataset.id;
    const defaultPrice = btn.dataset.price ? Number(btn.dataset.price) : 0;
    
    try {
      // Obtener QR del profesional
      const data = await window.apiRequest(`/pedidos/${id}/qr-pago`);
      
      if (!data.qr_pago) {
        window.showError('El profesional no tiene configurado un QR de pago', 'Error');
        return;
      }
      
      window.showModal({
        title: 'Pagar al Profesional',
        message: `
          <div class="text-center">
            <p class="mb-3"><strong>Monto a pagar: Bs. ${(data.precio || defaultPrice).toFixed(2)}</strong></p>
            <div class="mb-3">
              <img src="${data.qr_pago}" alt="QR de Pago" style="max-width: 300px; border: 2px solid #28a745; border-radius: 8px;" />
            </div>
            <p class="small text-muted">Escanea este QR con tu app bancaria o billetera digital para realizar el pago</p>
            <div class="alert alert-info mt-3">
              <i class="bi bi-info-circle"></i> Una vez realizado el pago, haz clic en "Confirmar Pago" para notificar al profesional
            </div>
          </div>
        `,
        type: 'info',
        confirmText: 'Confirmar Pago',
        cancelText: 'Cancelar',
        showCancel: true,
        onConfirm: async () => {
          const amount = data.precio || defaultPrice;
          try{
            const payload = { amount: Number(amount) };
            await window.apiRequest(`/pedidos/${id}/pay`, { 
              method: 'POST', 
              body: JSON.stringify(payload) 
            });
            window.showSuccess(`Pago de Bs. ${amount.toFixed(2)} confirmado`, '¡Pago Registrado!');
            setTimeout(() => loadPedidos(), 800);
          }catch(err){ window.showError(err.message||'Error al confirmar el pago', 'Error'); }
        }
      });
    } catch(err) {
      window.showError(err.message || 'Error al obtener el QR de pago', 'Error');
    }
  });

  // Calificar: abrir modal cuando cliente da click en calificar
  const ratingModalEl = document.getElementById('ratingModal');
  const ratingModal = ratingModalEl ? new bootstrap.Modal(ratingModalEl) : null;
  let currentPedidoToRate = null;
  let currentRatingValue = 5;

  pedidosContainer.addEventListener('click', (ev)=>{
    const btn = ev.target.closest && ev.target.closest('.calificarBtn');
    if (!btn) return;
    const id = btn.dataset.id;
    currentPedidoToRate = id;
    // reset modal
    document.getElementById('ratingComentario').value = '';
    currentRatingValue = 5;
    // reset star classes
    document.querySelectorAll('#ratingStars .star-btn').forEach(b=>{
      b.classList.remove('btn-warning');
      b.classList.add('btn-light');
    });
    // highlight default
    for (const b of document.querySelectorAll('#ratingStars .star-btn')){
      if (Number(b.dataset.value) <= currentRatingValue){ b.classList.add('btn-warning'); b.classList.remove('btn-light'); }
    }
    if (ratingModal) ratingModal.show();
  });

  // star selection handlers
  document.addEventListener('click', (ev)=>{
    const s = ev.target.closest && ev.target.closest('.star-btn');
    if (!s) return;
    const v = Number(s.dataset.value);
    currentRatingValue = v;
    document.querySelectorAll('#ratingStars .star-btn').forEach(b=>{
      const val = Number(b.dataset.value);
      if (val <= v){ b.classList.add('btn-warning'); b.classList.remove('btn-light'); }
      else { b.classList.remove('btn-warning'); b.classList.add('btn-light'); }
    });
  });

  // enviar rating
  const sendBtn = document.getElementById('sendRatingBtn');
  if (sendBtn){ sendBtn.addEventListener('click', async ()=>{
    if (!currentPedidoToRate) return alert('Pedido no seleccionado');
    const comentario = document.getElementById('ratingComentario').value || '';
    try{
      await window.apiRequest(`/pedidos/${currentPedidoToRate}/calificar`, { method: 'POST', body: JSON.stringify({ rating: currentRatingValue, comentario }) });
      alert('Gracias por tu calificación');
      if (ratingModal) ratingModal.hide();
      await loadPedidos();
    }catch(err){ alert(err.message||'Error'); }
  });}

  // Handler para botón de reclamar
  pedidosContainer.addEventListener('click', async (ev)=>{
    const btn = ev.target.closest && ev.target.closest('.reclamarBtn');
    if (!btn) return;
    const pedidoId = btn.dataset.pedidoId;
    const profesional = btn.dataset.profesional;
    
    const reclamoModal = new bootstrap.Modal(document.getElementById('reclamoModal'));
    document.getElementById('reclamoPedidoId').value = pedidoId;
    document.getElementById('reclamoProfesional').textContent = profesional;
    reclamoModal.show();
  });

  // Enviar reclamo
  const reclamoForm = document.getElementById('reclamoForm');
  if (reclamoForm) {
    reclamoForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const pedidoId = document.getElementById('reclamoPedidoId').value;
      const motivo = document.getElementById('reclamoMotivo').value;
      const descripcion = document.getElementById('reclamoDescripcion').value.trim();
      
      if (!descripcion) return alert('Describe el motivo del reclamo');
      
      try{
        await window.apiRequest('/reclamos', { 
          method: 'POST', 
          body: JSON.stringify({ pedidoId, motivo, descripcion }) 
        });
        alert('Reclamo enviado exitosamente. El administrador lo revisará.');
        const reclamoModal = bootstrap.Modal.getInstance(document.getElementById('reclamoModal'));
        if (reclamoModal) reclamoModal.hide();
        reclamoForm.reset();
      }catch(err){ 
        alert(err.message || 'Error al enviar reclamo'); 
      }
    });
  }

  // Event delegation para botones de chat
  pedidosContainer.addEventListener('click', (ev) => {
    const chatBtn = ev.target.closest('.chatBtn');
    if (!chatBtn) return;
    
    const pedidoId = chatBtn.dataset.pedidoId;
    const destinatarioId = chatBtn.dataset.destinatarioId;
    
    if (window.chatManager && pedidoId && destinatarioId) {
      window.chatManager.openChatForPedido(pedidoId, destinatarioId);
    }
  });
});
