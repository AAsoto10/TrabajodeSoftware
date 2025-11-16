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
    `;
    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) logoutLink.addEventListener('click',(e)=>{ e.preventDefault(); localStorage.removeItem('token'); localStorage.removeItem('user'); window.location='index.html'; });
  }

  function buildAnonymous(){
    const container = document.querySelector('.site-header .ms-auto');
    if (!container) return;
    container.innerHTML = `<a href="login.html" class="btn btn-info rounded-pill px-4">Iniciar Sesión</a>`;
  }

  document.addEventListener('DOMContentLoaded', async ()=>{
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
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
      const stored = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
      const token2 = localStorage.getItem('token');
      const payload = token2 ? parseJwt(token2) : null;
      buildLogged(payload, stored);
    });
  });
})();
