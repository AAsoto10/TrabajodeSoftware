document.addEventListener('DOMContentLoaded', ()=>{
  const el = document.querySelector('#catCarousel');
  if (el) new bootstrap.Carousel(el, {interval:3000});
});
