let scrollPosition = 0;

const wheelOpt = { passive: false };
const wheelEvent = 'onwheel' in document.createElement('div') ? 'wheel' : 'mousewheel';

function isScrollableContainer(target, selector) {
  const element = target instanceof Element ? target.closest(selector) : null;
  if (!element) return false;

  if (element.scrollHeight > element.clientHeight) {
    return true;
  }

  return false;
}

function preventDefault(e) {
  const modal = document.querySelector('.modal-container');
  const candidateProfile = document.querySelector('.candidate-profile-panel');
  const candidateBody = document.querySelector('.candidate-profile-body');

  if ((modal && modal.contains(e.target)) || (candidateProfile && candidateProfile.contains(e.target)) || (candidateBody && candidateBody.contains(e.target))) {
    return;
  }

  e.preventDefault();
}

function preventScrollKeys(e) {
  const keys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Spacebar'];
  if (keys.includes(e.key)) {
    const modal = document.querySelector('.modal-container');
    const candidateProfile = document.querySelector('.candidate-profile-panel');
    const candidateBody = document.querySelector('.candidate-profile-body');
    const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);

    if ((modal && modal.contains(e.target)) || (candidateProfile && candidateProfile.contains(e.target)) || (candidateBody && candidateBody.contains(e.target))) {
      if (isInput) return;
      if (isScrollableContainer(e.target, '.modal-container')) return;
      if (isScrollableContainer(e.target, '.candidate-profile-panel')) return;
      if (isScrollableContainer(e.target, '.candidate-profile-body')) return;
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
