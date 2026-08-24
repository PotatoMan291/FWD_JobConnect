import { getAccessibilitySettings, setColorVision, setFontSize } from '../utils/accessibility.js';
import { t } from '../utils/i18n.js';

const accessibilityIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="4" r="2"></circle><path d="M5 8h14"></path><path d="M12 6v6"></path><path d="m8 22 4-10 4 10"></path><path d="m7 14 5-2 5 2"></path></svg>`;
const closeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
const speakerIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>`;

let utterance = null;

function getReadableText() {
  const target = document.querySelector('.content-body, main, .login-form-card, .login-container');
  if (!target) return document.body.innerText.trim();

  const clone = target.cloneNode(true);
  clone.querySelectorAll('button, input, select, textarea, script, style, [aria-hidden="true"]').forEach(el => el.remove());
  return clone.innerText.replace(/\s+/g, ' ').trim();
}

function stopSpeech() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  utterance = null;
}

export function renderAccessibilityMenu(container) {
  if (!container) return;
  const settings = getAccessibilitySettings();

  container.innerHTML = `
    <button class="btn btn-secondary btn-icon" id="accessibility-btn" type="button"
      aria-label="${t('accessibility.open')}" title="${t('accessibility.open')}" aria-haspopup="dialog">
      ${accessibilityIcon}
    </button>

    <div class="accessibility-overlay" id="accessibility-overlay" aria-hidden="true">
      <section class="accessibility-dialog" role="dialog" aria-modal="true" aria-labelledby="accessibility-title">
        <div class="accessibility-dialog-header">
          <div>
            <h3 id="accessibility-title">${t('accessibility.title')}</h3>
            <p>${t('accessibility.subtitle')}</p>
          </div>
          <button class="btn btn-icon accessibility-close" id="accessibility-close" type="button" aria-label="${t('accessibility.close')}">${closeIcon}</button>
        </div>

        <div class="accessibility-dialog-body">
          <fieldset class="accessibility-section">
            <legend>${t('accessibility.colorVision')}</legend>
            <p class="accessibility-help">${t('accessibility.colorVisionHelp')}</p>
            <div class="accessibility-options accessibility-options-grid">
              ${[
                ['none', t('accessibility.none')],
                ['protanopia', t('accessibility.protanopia')],
                ['deuteranopia', t('accessibility.deuteranopia')],
                ['tritanopia', t('accessibility.tritanopia')]
              ].map(([value, label]) => `
                <label class="accessibility-choice">
                  <input type="radio" name="color-vision" value="${value}" ${settings.colorVision === value ? 'checked' : ''}>
                  <span>${label}</span>
                </label>
              `).join('')}
            </div>
          </fieldset>

          <fieldset class="accessibility-section">
            <legend>${t('accessibility.fontSize')}</legend>
            <div class="accessibility-options font-size-options">
              ${[
                ['normal', t('accessibility.fontNormal'), 'A'],
                ['large', t('accessibility.fontLarge'), 'A+'],
                ['xlarge', t('accessibility.fontXLarge'), 'A++']
              ].map(([value, label, sample]) => `
                <label class="accessibility-choice font-choice">
                  <input type="radio" name="font-size" value="${value}" ${settings.fontSize === value ? 'checked' : ''}>
                  <span><strong>${sample}</strong>${label}</span>
                </label>
              `).join('')}
            </div>
          </fieldset>

          <section class="accessibility-section" aria-labelledby="tts-title">
            <h4 id="tts-title">${t('accessibility.tts')}</h4>
            <p class="accessibility-help">${t('accessibility.ttsHelp')}</p>
            <div class="tts-controls">
              <button class="btn btn-primary" id="tts-read" type="button">${speakerIcon}<span>${t('accessibility.read')}</span></button>
              <button class="btn btn-secondary" id="tts-pause" type="button">${t('accessibility.pause')}</button>
              <button class="btn btn-secondary" id="tts-stop" type="button">${t('accessibility.stop')}</button>
            </div>
            <p id="tts-status" class="accessibility-status" role="status" aria-live="polite"></p>
          </section>
        </div>
      </section>
    </div>
  `;

  const openBtn = container.querySelector('#accessibility-btn');
  const overlay = container.querySelector('#accessibility-overlay');
  const closeBtn = container.querySelector('#accessibility-close');
  const readBtn = container.querySelector('#tts-read');
  const pauseBtn = container.querySelector('#tts-pause');
  const stopBtn = container.querySelector('#tts-stop');
  const status = container.querySelector('#tts-status');

  const openDialog = () => {
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    closeBtn.focus();
  };

  const closeDialog = () => {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    openBtn.focus();
  };

  openBtn.addEventListener('click', openDialog);
  closeBtn.addEventListener('click', closeDialog);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeDialog();
  });

  overlay.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeDialog();
  });

  container.querySelectorAll('input[name="color-vision"]').forEach(input => {
    input.addEventListener('change', () => setColorVision(input.value));
  });

  container.querySelectorAll('input[name="font-size"]').forEach(input => {
    input.addEventListener('change', () => setFontSize(input.value));
  });

  if (!('speechSynthesis' in window)) {
    readBtn.disabled = true;
    pauseBtn.disabled = true;
    stopBtn.disabled = true;
    status.textContent = t('accessibility.ttsUnsupported');
  } else {
    readBtn.addEventListener('click', () => {
      stopSpeech();
      const text = getReadableText();
      if (!text) {
        status.textContent = t('accessibility.noText');
        return;
      }

      utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = document.documentElement.lang === 'en' ? 'en-US' : 'es-ES';
      utterance.rate = 1;
      utterance.onstart = () => { status.textContent = t('accessibility.reading'); };
      utterance.onend = () => { status.textContent = t('accessibility.finished'); utterance = null; };
      utterance.onerror = () => { status.textContent = t('accessibility.ttsError'); utterance = null; };
      window.speechSynthesis.speak(utterance);
    });

    pauseBtn.addEventListener('click', () => {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        pauseBtn.textContent = t('accessibility.resume');
        status.textContent = t('accessibility.paused');
      } else if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        pauseBtn.textContent = t('accessibility.pause');
        status.textContent = t('accessibility.reading');
      }
    });

    stopBtn.addEventListener('click', () => {
      stopSpeech();
      pauseBtn.textContent = t('accessibility.pause');
      status.textContent = t('accessibility.stopped');
    });
  }
}
