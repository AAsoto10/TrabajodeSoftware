document.addEventListener('DOMContentLoaded', async ()=>{
  const el = document.querySelector('#catCarousel');
  if (el) new bootstrap.Carousel(el, {interval:3000});
  
  // Cargar categorías dinámicamente en la página principal
  await loadCategoriasHome();
  
  // Iniciar carrusel de imágenes del hero
  initHeroCarousel();
});

// Carrusel automático de imágenes de fondo del hero
function initHeroCarousel() {
  const slides = document.querySelectorAll('.hero-slide');
  if (slides.length === 0) return;
  
  let currentSlide = 0;
  
  function nextSlide() {
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add('active');
  }
  
  // Cambiar imagen cada 5 segundos
  setInterval(nextSlide, 5000);
}

async function loadCategoriasHome() {
  const servicesGrid = document.querySelector('.services-grid');
  if (!servicesGrid) return;
  
  try {
    // Detectar si estamos en producción o local
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    const API_BASE = isProduction ? '/api' : 'http://localhost:3000/api';
    
    const response = await fetch(`${API_BASE}/categorias/activas`);
    if (!response.ok) throw new Error('Error al cargar categorías');
    
    const categorias = await response.json();
    
    if (!categorias || categorias.length === 0) {
      servicesGrid.innerHTML = '<div class="col-12 text-center text-muted">No hay servicios disponibles</div>';
      return;
    }
    
    let html = '';
    categorias.forEach(cat => {
      html += `
        <div class="col-md-6 col-lg-3">
          <div class="card service-card h-100 text-center p-4">
            <div class="service-icon mb-3 mx-auto">
              <i class="bi ${cat.icono || 'bi-tools'}" style="font-size: 3rem; color: #007BFF;"></i>
            </div>
            <h5 class="fw-bold">${cat.nombre}</h5>
            <p class="small text-muted">${cat.descripcion || 'Servicio profesional de calidad'}</p>
            <div class="mt-auto d-grid">
              <a href="profesionales.html?categoria=${encodeURIComponent(cat.nombre)}" class="btn btn-primary rounded-pill">Ver Profesionales &rarr;</a>
            </div>
          </div>
        </div>`;
    });
    
    servicesGrid.innerHTML = html;
  } catch(err) {
    console.error('Error cargando categorías:', err);
    // Mantener las categorías por defecto si hay error
  }
}
