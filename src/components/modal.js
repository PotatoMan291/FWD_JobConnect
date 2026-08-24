import { icons } from '../assets/icons/icons.js';
import { bloquearScroll, desbloquearScroll } from '../utils/scroll-lock.js';

let activeOverlay = null;

export function openModal({ title, bodyHTML, footerHTML, onClose = null }) {
  closeModal();
  bloquearScroll();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  overlay.innerHTML = `
    <div class="modal-container" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h3>${title}</h3>
        <button class="modal-close-btn" aria-label="Cerrar modal">
          ${icons.close}
        </button>
      </div>
      <div class="modal-body">
        ${bodyHTML}
      </div>
      ${footerHTML ? `<div class="modal-footer">${footerHTML}</div>` : ''}
    </div>
  `;

  document.body.appendChild(overlay);
  activeOverlay = overlay;

  // Forzar reflow para animación CSS
  void overlay.offsetWidth;
  overlay.classList.add('open');

  const closeBtn = overlay.querySelector('.modal-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      closeModal();
      if (onClose) onClose();
    });
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
      if (onClose) onClose();
    }
  });

  const handleEsc = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      if (onClose) onClose();
      document.removeEventListener('keydown', handleEsc);
    }
  };
  document.addEventListener('keydown', handleEsc);

  return overlay;
}

export function closeModal() {
  if (activeOverlay) {
    desbloquearScroll();
    activeOverlay.classList.remove('open');
    setTimeout(() => {
      if (activeOverlay && activeOverlay.parentNode) {
        activeOverlay.parentNode.removeChild(activeOverlay);
      }
      activeOverlay = null;
    }, 200);
  }
}
