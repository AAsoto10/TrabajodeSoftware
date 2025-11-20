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
        sessionStorage.setItem('token', res.token);
        // store minimal user info for header display
        if (res.user) sessionStorage.setItem('user', JSON.stringify(res.user));
        const role = res.user && res.user.role ? res.user.role : 'cliente';
        window.showSuccess('Has iniciado sesión correctamente', 'Bienvenido');
        setTimeout(() => {
          if (role === 'admin') window.location = 'panel-admin.html';
          else if (role === 'profesional') window.location = 'panel-profesional.html';
          else window.location = 'panel-cliente.html';
        }, 800);
      }catch(err){ window.showError(err.message || 'Error al iniciar sesión', 'Error de Login'); }
    });
  }

  if (registerForm){
    registerForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const fd = new FormData(registerForm);
      const role = fd.get('role');
      
      // Si es profesional, convertir la foto a base64
      let foto_ci_base64 = null;
      if (role === 'profesional') {
        const foto_ci_file = fd.get('foto_ci');
        if (foto_ci_file && foto_ci_file.size > 0) {
          foto_ci_base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(foto_ci_file);
          });
        }
      }
      
      const body = { 
        nombre: fd.get('nombre'), 
        email: fd.get('email'), 
        password: fd.get('password'), 
        role: role,
        foto_ci: foto_ci_base64,
        motivacion: fd.get('motivacion')
      };
      
      try{
        const res = await window.apiRequest('/auth/register',{method:'POST',body:JSON.stringify(body)});
        
        // Si es profesional, mostrar mensaje de que será revisado
        if (role === 'profesional') {
          window.showSuccess('Tu solicitud ha sido enviada. Un administrador revisará tu información y te notificaremos por email cuando sea aprobada.', '¡Solicitud Enviada!');
          setTimeout(() => window.location = 'login.html', 3000);
        } else {
          // Auto-login para clientes
          try{
            const loginRes = await window.apiRequest('/auth/login',{method:'POST', body: JSON.stringify({ email: body.email, password: body.password })});
            sessionStorage.setItem('token', loginRes.token);
            if (loginRes.user) sessionStorage.setItem('user', JSON.stringify(loginRes.user));
            window.showSuccess('Cuenta creada exitosamente', '¡Bienvenido!');
            setTimeout(() => window.location = 'panel-cliente.html', 800);
          }catch(loginErr){
            window.showSuccess('Registro exitoso. Por favor inicia sesión.', '¡Cuenta Creada!');
            setTimeout(() => window.location = 'login.html', 1500);
          }
        }
      }catch(err){ window.showError(err.message||'Error al registrar la cuenta', 'Error de Registro'); }
    });
  }
  // No mostramos categoría en el registro; la completará el profesional en su panel
});
