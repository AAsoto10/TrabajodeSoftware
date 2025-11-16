(function(){
  const API_BASE = 'http://localhost:3000/api';
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
