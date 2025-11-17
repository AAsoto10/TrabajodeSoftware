document.addEventListener('DOMContentLoaded', async ()=>{
  const token = localStorage.getItem('token');
  if (!token){ window.location = 'login.html'; return; }

  const nombreEl = document.getElementById('nombre');
  const emailEl = document.getElementById('email');
  const passwordEl = document.getElementById('password');
  const categoriaField = document.getElementById('categoriaField');
  const categoriaEl = document.getElementById('categoria');

  // load current user
  try{
    const res = await fetch('/api/auth/me', { headers: { 'Authorization': 'Bearer ' + token } });
    if (!res.ok) throw new Error('No autorizado');
    const user = await res.json();
    nombreEl.value = user.nombre || '';
    emailEl.value = user.email || '';
    if (user.role === 'profesional'){
      categoriaField.classList.remove('d-none');
      categoriaEl.value = user.categoria || '';
    }
  }catch(err){ window.showError('Error cargando usuario: ' + (err.message||err), 'Error'); }

  const form = document.getElementById('profileForm');
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const body = { nombre: nombreEl.value };
    if (passwordEl.value) body.password = passwordEl.value;
    if (!categoriaField.classList.contains('d-none')) body.categoria = categoriaEl.value;
    try{
      const res = await fetch('/api/auth/me', { method: 'PUT', headers: { 'Content-Type':'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify(body) });
      if (!res.ok){ const j = await res.json().catch(()=>null); throw new Error((j && j.message) ? j.message : 'Error'); }
      const updated = await res.json();
      // update localStorage user name
      const stored = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : {};
      stored.nombre = updated.nombre;
      localStorage.setItem('user', JSON.stringify(stored));
      window.showSuccess('Perfil actualizado correctamente', '¡Actualizado!');
      // update header display
      setTimeout(() => {
        const event = new Event('profileUpdated'); window.dispatchEvent(event);
      }, 600);
    }catch(err){ window.showError('Error: ' + (err.message||err), 'Error'); }
  });
});
