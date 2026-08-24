let scrollPosition = 0;

const wheelOpt = { passive: false };
const wheelEvent = 'onwheel' in document.createElement('div') ? 'wheel' : 'mousewheel';

function preventDefault(e) {
  const modal = document.querySelector('.modal-container');
  // Permitir scroll si el evento ocurre dentro del modal
  if (modal && modal.contains(e.target)) {
    return;
  }
  e.preventDefault();
}

function preventScrollKeys(e) {
  const keys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Spacebar'];
  if (keys.includes(e.key)) {
    const modal = document.querySelector('.modal-container');
    const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);
    
    // Si estamos en un input o dentro del modal, no prevenimos
    if (modal && modal.contains(e.target)) {
      if (isInput) return;
      // Permitir si el modal tiene scroll interno
      if (modal.scrollHeight > modal.clientHeight) return;
    }
    
    e.preventDefault();
  }
}

export function bloquearScroll() {
  scrollPosition = window.scrollY;
  
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollPosition}px`;
  document.body.style.width = '100%';
  
  window.addEventListener(wheelEvent, preventDefault, wheelOpt);
  window.addEventListener('touchmove', preventDefault, wheelOpt);
  window.addEventListener('keydown', preventScrollKeys, { passive: false });
}

export function desbloquearScroll() {
  document.body.style.removeProperty('overflow');
  document.body.style.removeProperty('position');
  document.body.style.removeProperty('top');
  document.body.style.removeProperty('width');
  
  window.scrollTo(0, scrollPosition);
  
  window.removeEventListener(wheelEvent, preventDefault, wheelOpt);
  window.removeEventListener('touchmove', preventDefault, wheelOpt);
  window.removeEventListener('keydown', preventScrollKeys);
}
