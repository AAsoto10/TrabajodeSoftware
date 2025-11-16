document.addEventListener('DOMContentLoaded', ()=>{
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  if (loginForm){
    loginForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const fd = new FormData(loginForm);
      const body = { email: fd.get('email'), password: fd.get('password') };
      try{
        const res = await window.apiRequest('/auth/login',{method:'POST',body:JSON.stringify(body)});
        localStorage.setItem('token', res.token);
        // store minimal user info for header display
        if (res.user) localStorage.setItem('user', JSON.stringify(res.user));
        alert('Login correcto');
        const role = res.user && res.user.role ? res.user.role : 'cliente';
        if (role === 'admin') window.location = 'panel-admin.html';
        else if (role === 'profesional') window.location = 'panel-profesional.html';
        else window.location = 'panel-cliente.html';
      }catch(err){ alert(err.message || 'Error'); }
    });
  }

  if (registerForm){
    registerForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const fd = new FormData(registerForm);
      const body = { nombre: fd.get('nombre'), email: fd.get('email'), password: fd.get('password'), role: fd.get('role') };
      try{
        const res = await window.apiRequest('/auth/register',{method:'POST',body:JSON.stringify(body)});
        // Auto-login after successful registration
        try{
          const loginRes = await window.apiRequest('/auth/login',{method:'POST', body: JSON.stringify({ email: body.email, password: body.password })});
          localStorage.setItem('token', loginRes.token);
          if (loginRes.user) localStorage.setItem('user', JSON.stringify(loginRes.user));
          const role = loginRes.user && loginRes.user.role ? loginRes.user.role : body.role;
          if (role === 'admin') window.location = 'panel-admin.html';
          else if (role === 'profesional') window.location = 'panel-profesional.html';
          else window.location = 'panel-cliente.html';
        }catch(loginErr){
          // If auto-login fails, fallback to login page
          alert('Registro OK. Por favor inicia sesión.');
          window.location = 'login.html';
        }
      }catch(err){ alert(err.message||'Error'); }
    });
  }
  // No mostramos categoría en el registro; la completará el profesional en su panel
});
