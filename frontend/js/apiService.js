(function(){
  // Detectar si estamos en producción (Render) o local
  const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
  const API_BASE = isProduction ? '/api' : 'http://localhost:3000/api';
  window.apiRequest = async function(path, options = {}){
    const token = localStorage.getItem('token');
    options.headers = options.headers || {};
    options.headers['Content-Type'] = 'application/json';
    if (token) options.headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(API_BASE + path, options);
    if (!res.ok) {
      const err = await res.json().catch(()=>({message:'Error'}));
      throw err;
    }
    return res.json().catch(()=>({}));
  }
})();
